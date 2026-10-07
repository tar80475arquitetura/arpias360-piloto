"""Validate the original CPRM ZIP and create display derivatives, without repairs."""
import hashlib
import json
import pathlib
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.cache/geospatial'))
sys.stdout.reconfigure(encoding='utf-8')
import shapefile
from pyproj import CRS, Transformer
from shapely.geometry import shape, mapping
from shapely.ops import transform

archive = ROOT / 'data/raw/cprm/niteroi_padraoderelevo.zip'
work = (ROOT / '.cache/cprm-source').resolve()
output = ROOT / 'data/processed/cprm'
output.mkdir(parents=True, exist_ok=True)
work.mkdir(parents=True, exist_ok=True)
manifest = {'source': 'CPRM / Serviço Geológico do Brasil', 'year': 2017,
            'scale': '1:30.000', 'url': 'https://rigeo.sgb.gov.br/handle/doc/17483',
            'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'files': [], 'layers': []}
with zipfile.ZipFile(archive) as bundle:
    if bundle.testzip() is not None:
        raise ValueError('ZIP corrompido')
    for member in bundle.infolist():
        target = (work / member.filename).resolve()
        if not target.is_relative_to(work):
            raise ValueError('Caminho inseguro no ZIP')
        manifest['files'].append({'name': member.filename, 'bytes': member.file_size})
        if not member.is_dir():
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(bundle.read(member))

collections = {}
for filename in work.rglob('*.shp'):
    for extension in ['.shx', '.dbf', '.prj', '.cpg']:
        if not filename.with_suffix(extension).is_file():
            raise ValueError('Auxiliar ausente: ' + extension)
    encoding = filename.with_suffix('.cpg').read_text().strip()
    reader = shapefile.Reader(str(filename), encoding=encoding)
    crs = CRS.from_wkt(filename.with_suffix('.prj').read_text())
    projector = Transformer.from_crs(crs, CRS.from_epsg(4326), always_xy=True, allow_ballpark=False)
    fields = [list(field) for field in reader.fields if field[0] != 'DeletionFlag']
    name = 'limite-pacote' if filename.stem == 'limite_niteroi' else 'padroes-relevo'
    features, vertices = [], []
    for index, record in enumerate(reader.iterShapeRecords()):
        original = shape(record.shape.__geo_interface__)
        if not original.is_valid or original.is_empty:
            raise ValueError(f'Geometria original inválida: {filename.name} / {index}')
        geometry = transform(projector.transform, original)
        if not geometry.is_valid or geometry.is_empty:
            raise ValueError('Geometria derivada inválida')
        west, south, east, north = geometry.bounds
        if not (-43.3 < west <= east < -42.8 and -23.1 < south <= north < -22.7):
            raise ValueError('Extensão fora da área de Niterói')
        properties = record.record.as_dict()
        if name == 'padroes-relevo' and (properties['MUNICIPIO'] != 'Niterói' or properties['UF'] != 'RJ'):
            raise ValueError('Município incompatível')
        features.append({'type': 'Feature', 'id': index, 'properties': properties,
                         'geometry': mapping(geometry)})
        vertices.append(len(record.shape.points))
    collection = {'type': 'FeatureCollection', 'features': features}
    target = output / (name + '.geojson')
    target.write_text(json.dumps(collection, ensure_ascii=False, separators=(',', ':'), allow_nan=False), encoding='utf-8')
    layer = {'name': filename.name, 'derivative': target.relative_to(ROOT).as_posix(),
             'shapeType': reader.shapeTypeName, 'features': len(features), 'crs': crs.to_epsg(),
             'crsWkt': filename.with_suffix('.prj').read_text(), 'encoding': encoding,
             'fields': fields, 'sourceExtent': list(reader.bbox), 'targetExtent': list(shape({'type':'GeometryCollection','geometries':[f['geometry'] for f in features]}).bounds),
             'invalidGeometries': 0, 'vertices': sum(vertices), 'maxVerticesPerFeature': max(vertices),
             'transformation': projector.description, 'accuracyMeters': projector.accuracy,
             'simplification': False, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    if name == 'padroes-relevo':
        layer['classes'] = {field: sorted({f['properties'][field] for f in features}) for field in ['COD_REL','PADRAO','UnGeomorf','UnMorfoest','UnMorfoesc']}
        layer['classCounts'] = {code: sum(f['properties']['COD_REL']==code for f in features) for code in layer['classes']['COD_REL']}
        layer['areaKm2AllZero'] = all(f['properties']['AREA_KM2']==0 for f in features)
    manifest['layers'].append(layer)
    collections[name] = features

border = shape(collections['limite-pacote'][0]['geometry'])
relief = collections['padroes-relevo']
manifest['territorialCheck'] = {'allMunicipalityNiteroi': True, 'outsidePackageBoundaryAreaDegrees2': sum(shape(f['geometry']).difference(border).area for f in relief), 'note': 'Comparação com limite IBGE 2015 do próprio pacote; diferenças cartográficas não foram recortadas nem corrigidas.'}
manifest['privacy'] = 'Campos técnicos e administrativos; sem nomes pessoais, CPF, contatos ou proprietários.'
manifest['processing'] = 'CRS lido de cada PRJ; transformação para EPSG:4326 com always_xy; sem arredondamento, simplificação, recorte ou reparo. GeoJSON 2D não representa a medida M de PolygonM.'
(output / 'manifesto.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'layers': [{k: layer[k] for k in ['name','features','crs','encoding','maxVerticesPerFeature','targetExtent']} for layer in manifest['layers']], 'sha256': manifest['sha256']}, ensure_ascii=False))
