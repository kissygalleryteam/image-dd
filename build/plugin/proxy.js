//! Copyright 2015, kissy-gallery-dd@0.0.1 MIT Licensed, build time: Fri, 06 Feb 2015 05:16:36 GMT 
define("kg/dd/0.0.1/plugin/proxy", ["kg/dd/0.0.1/index","base"], function(require, exports, module) {
var dd = require("kg/dd/0.0.1/index");
var base = require("base");
/*
combined modules:
dd/plugin/proxy
*/
var ddPluginProxy;
ddPluginProxy = function (exports) {
  /**
   * @ignore
   * generate proxy drag object,
   * @author yiminghe@gmail.com
   */
  var DD = dd, Base = base;
  var DDM = DD.DDM, PROXY_EVENT = '.-ks-proxy' + +new Date();
  /**
   * @extends KISSY.Base
   * @class KISSY.DD.Plugin.Proxy
   * Proxy plugin to provide abilities for draggable tp create a proxy drag node,
   * instead of dragging the original node.
   */
  exports = Base.extend({
    pluginId: 'dd/plugin/proxy',
    pluginInitializer: function (drag) {
      var self = this;
      function start() {
        var node = self.get('node'), dragNode = drag.get('node');
        if (!self.get('proxyNode')) {
          if (typeof node === 'function') {
            node = node(drag);
            node.addClass('ks-dd-proxy');
            self.set('proxyNode', node);
          }
        } else {
          node = self.get('proxyNode');
        }
        node.show();
        dragNode.parent().append(node);
        DDM.cacheWH(node);
        node.offset(dragNode.offset());
        drag.setInternal('dragNode', dragNode);
        drag.setInternal('node', node);
      }
      function end() {
        var node = self.get('proxyNode'), dragNode = drag.get('dragNode');
        if (self.get('moveOnEnd')) {
          dragNode.offset(node.offset());
        }
        if (self.get('destroyOnEnd')) {
          node.remove();
          self.set('proxyNode', 0);
        } else {
          node.hide();
        }
        drag.setInternal('node', dragNode);
      }
      drag.on('dragstart' + PROXY_EVENT, start).on('dragend' + PROXY_EVENT, end);
    },
    pluginDestructor: function (drag) {
      drag.detach(PROXY_EVENT);
    }
  }, {
    ATTRS: {
      node: {
        value: function (drag) {
          return drag.get('node').clone(true);
        }
      },
      destroyOnEnd: { value: false },
      moveOnEnd: { value: true },
      proxyNode: {}
    }
  });
  return exports;
}();
module.exports = ddPluginProxy;
});