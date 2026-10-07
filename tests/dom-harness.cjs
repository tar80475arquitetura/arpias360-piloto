class Element{
  constructor(tag='div',text='',className=''){this.tagName=tag.toUpperCase();this.ownText=String(text??'');this.className=className;this.children=[];this.listeners={};this.attributes={};this.hidden=false;this.disabled=false;this.open=false;this.style={};this.namespaceURI='http://www.w3.org/2000/svg';}
  get textContent(){return this.ownText+this.children.map(c=>c.textContent??'').join(' ')}
  set textContent(value){this.ownText=String(value);this.children=[];}
  append(...nodes){this.children.push(...nodes)}
  replaceChildren(...nodes){this.ownText='';this.children=nodes}
  setAttribute(name,value){this.attributes[name]=String(value)}
  addEventListener(name,run){this.listeners[name]=run}
  showModal(){this.open=true}close(){this.open=false}
  getBoundingClientRect(){return {left:0,top:0,width:800,height:600,right:800,bottom:600}}
  getContext(){return new Proxy({},{get:()=>()=>{}})}
  toDataURL(){return 'data:image/png;base64,dGVzdA=='}
}
const element=(tag,text,className)=>new Element(tag,text,className);
const content=(title,rows=[],note)=>{const root=element('section',title);rows.forEach(([key,value])=>{if(value!==undefined&&value!==null&&value!=='')root.append(element('dt',key),element('dd',value))});if(note)root.append(element('p',note));return root;};
module.exports={Element,element,content};
