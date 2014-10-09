/*
Thu Oct 09 2014 11:26:55 GMT+0800 (CST)
combined files by KMD:

index.js
*/

KISSY.add('kg/dd/2.0.0/index',["node","base"],function(S ,require, exports, module) {
var $ = require('node').all;
var Base = require('base');

var Dd = Base.extend({
    initializer:function(){
        var self = this;
        var $target = self.get('$target');
    }
},{
    ATTRS:{
        $target:{
            value:'',
            getter:function(v){
                return $(v);
            }
        }
    }
});

module.exports = Dd;




});