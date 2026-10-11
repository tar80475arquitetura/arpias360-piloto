/* Screen positions only: moving a window never changes its map geometry. */
(function(root){
  function clamp(x,y,width,height,frameWidth,frameHeight){
    const bound=(value,size,total)=>Math.max(0,Math.min(value,Math.max(0,total-size)));
    return {x:bound(x,width,frameWidth),y:bound(y,height,frameHeight)};
  }
  function bind(node,selector,frame,offset=false){
    if(!node)return;
    if(node.dataset.movable){node._arpiasResume?.();return;}
    node.dataset.movable='true';
    let drag=null,shift={x:0,y:0},active=false;
    const bounds=()=>frame?frame.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerHeight};
    function move(x,y){
      const f=bounds(),r=node.getBoundingClientRect(),p=clamp(x,y,r.width,r.height,f.width,f.height);
      if(offset){
        shift.x+=p.x-(r.left-f.left);shift.y+=p.y-(r.top-f.top);
        node.style.translate=`${shift.x}px ${shift.y}px`;node.classList.add('popup-moved');
      }else{
        if(node.tagName==='DIALOG')Object.assign(node.style,{position:'fixed',margin:'0'});
        Object.assign(node.style,{left:p.x+'px',top:p.y+'px',right:'auto',bottom:'auto',transform:'none'});
      }
      return p;
    }
    const moved=()=>{if(node.id)document.dispatchEvent(new CustomEvent('arpias:panel-moved',{detail:node.id}));};
    const handleFor=e=>e.target.closest(selector);
    const interactive=e=>e.target.closest('button,input,select,textarea,a,summary');
    function pointerDown(e){
      const handle=handleFor(e);if(!handle||!node.contains(handle)||interactive(e)||e.button!==0)return;
      e.preventDefault();e.stopPropagation();
      const f=bounds(),r=node.getBoundingClientRect();
      drag={dx:e.clientX-r.left,dy:e.clientY-r.top,id:e.pointerId,handle};
      if(!offset)move(r.left-f.left,r.top-f.top);
      handle.setPointerCapture(e.pointerId);
      node.classList.add('is-dragging');document.body.classList.add('dragging-panel');
    }
    function pointerMove(e){
      if(!drag||e.pointerId!==drag.id)return;
      e.preventDefault();e.stopPropagation();const f=bounds();move(e.clientX-f.left-drag.dx,e.clientY-f.top-drag.dy);
    }
    function stop(e){
      if(!drag||e.pointerId!==drag.id)return;
      const handle=drag.handle;drag=null;node.classList.remove('is-dragging');document.body.classList.remove('dragging-panel');
      if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);moved();
    }
    function keyDown(e){
      if(!handleFor(e)||interactive(e))return;
      const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!delta)return;
      e.preventDefault();e.stopPropagation();const f=bounds(),r=node.getBoundingClientRect(),step=e.shiftKey?40:10;
      move(r.left-f.left+delta[0]*step,r.top-f.top+delta[1]*step);moved();
    }
    function prepare(){
      node.querySelectorAll(selector).forEach(h=>{
        h.classList.add('drag-handle');h.tabIndex=0;h.title='Arraste para mover; ou use as setas do teclado';
        h.setAttribute('aria-description','Janela móvel. Arraste ou use as setas do teclado.');
      });
    }
    function keepInside(){
      if(!node.getClientRects().length||node.hidden||node.classList.contains('hidden')||node.tagName==='DIALOG'&&!node.open)return;
      if(!offset&&!node.style.left)return;
      const f=bounds(),r=node.getBoundingClientRect(),p=clamp(r.left-f.left,r.top-f.top,r.width,r.height,f.width,f.height);
      if(Math.abs(p.x-(r.left-f.left))>.5||Math.abs(p.y-(r.top-f.top))>.5)move(p.x,p.y);
    }
    const mutation=new MutationObserver(prepare),resize=new ResizeObserver(keepInside);
    const listeners=[['pointerdown',pointerDown],['pointermove',pointerMove],['pointerup',stop],['pointercancel',stop],['lostpointercapture',stop],['keydown',keyDown]];
    function resume(){
      if(active)return;active=true;
      // Content may have changed while the popup was detached.
      prepare();mutation.observe(node,{childList:true,subtree:true});
      resize.observe(node);if(frame)resize.observe(frame);
      for(const [type,listener] of listeners)node.addEventListener(type,listener);
      window.addEventListener('resize',keepInside);
    }
    function dispose(){
      if(!active)return;active=false;
      mutation.disconnect();resize.disconnect();window.removeEventListener('resize',keepInside);
      for(const [type,listener] of listeners)node.removeEventListener(type,listener);
      if(drag){
        const {handle,id}=drag;drag=null;
        node.classList.remove('is-dragging');document.body.classList.remove('dragging-panel');
        if(handle.hasPointerCapture(id))handle.releasePointerCapture(id);
      }
    }
    resume();
    // Leaflet popup elements are disposable; release observers on removal.
    if(offset){
      node._arpiasKeepInside=keepInside;
      node._arpiasDispose=dispose;
      node._arpiasResume=resume;
    }
  }
  const api={clamp,bind};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ARPIASPanels=api;
})(typeof window==='object'?window:globalThis);
