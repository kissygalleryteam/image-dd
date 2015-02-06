//! Copyright 2015, kissy-gallery-dd@0.0.1 MIT Licensed, build time: Fri, 06 Feb 2015 05:16:36 GMT 
KISSY.config({
"modules": 
{
    "kg/dd/0.0.1/index": {
        "requires": [
            "util",
            "base",
            "ua",
            "node",
            "event-dom/gesture/basic",
            "event-dom/gesture/pan"
        ]
    },
    "kg/dd/0.0.1/plugin/constrain": {
        "requires": [
            "base",
            "util",
            "node"
        ]
    },
    "kg/dd/0.0.1/plugin/proxy": {
        "requires": [
            "kg/dd/0.0.1/index",
            "base"
        ]
    },
    "kg/dd/0.0.1/plugin/scroll": {
        "requires": [
            "util",
            "node",
            "kg/dd/0.0.1/index",
            "base"
        ]
    }
}
});