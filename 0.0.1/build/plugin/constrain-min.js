//! Copyright 2015, kissy-gallery-dd@0.0.1 MIT Licensed, build time: Fri, 06 Feb 2015 03:41:09 GMT 
define("kg/dd/0.0.1/plugin/constrain",["base","util","node"],function(t,n,i){var o,e=t("base"),r=t("util"),a=t("node");o=function(t){function n(t){var n,i,o,e=this,r=t.drag,a=r.get("dragNode"),s=e.get("constrain");s&&(g.isWindow(s[0])?e.__constrainRegion={left:n=s.scrollLeft(),top:i=s.scrollTop(),right:n+s.width(),bottom:i+s.height()}:s.getDOMNode?(o=s.offset(),e.__constrainRegion={left:o.left,top:o.top,right:o.left+s.outerWidth(),bottom:o.top+s.outerHeight()}):g.isPlainObject(s)&&(e.__constrainRegion=s),e.__constrainRegion&&(e.__constrainRegion.right-=a.outerWidth(),e.__constrainRegion.bottom-=a.outerHeight()))}function i(t){var n=this,i={},o=t.left,e=t.top,r=n.__constrainRegion;r&&(i.left=Math.min(Math.max(r.left,o),r.right),i.top=Math.min(Math.max(r.top,e),r.bottom),t.drag.setInternal("actualPos",i))}function o(){this.__constrainRegion=null}var s=e,g=r,c=a,u=".-ks-constrain"+g.now(),l=window;return t=s.extend({pluginId:"dd/plugin/constrain",__constrainRegion:null,pluginInitializer:function(t){var e=this;t.on("dragstart"+u,n,e).on("dragend"+u,o,e).on("dragalign"+u,i,e)},pluginDestructor:function(t){t.detach(u,{context:this})}},{ATTRS:{constrain:{valueFn:function(){return c(l)},setter:function(t){if(t){if(t===!0)return c(l);if(t.nodeType||g.isWindow(t)||"string"==typeof t)return c(t)}return t}}}})}(),i.exports=o});