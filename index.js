<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> a9e16490e9acf6ade24352f791de9fdc19e51a3e
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



<<<<<<< HEAD
=======
module.exports = require('./lib/dd');
module.exports.version = require('./package.json').version;
>>>>>>> master
=======
>>>>>>> a9e16490e9acf6ade24352f791de9fdc19e51a3e
