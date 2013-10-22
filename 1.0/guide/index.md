## 综述

Image-DD 是一个支持鼠标拖拽图片，及其鼠标滚轮来放大|缩小图片的组件。 
目前只支持pc端，无线端的支持正在开发中...

##观看效果
[demo](../demo/index.html)

## 组件快速使用

###组件依赖html结构
```xml
    <img class="J_ImgDD" src="abc-mini.jpg" data-original-url="abc-big.jpg"/>
```
<img>的data-original-url存放大图的url，但是此为非必写项（未定义时大图仍按src值加载）；

###组件初始化参数

```javascript
    KISSY.use('gallery/image-dd/1.0/index', function(S, ImageDD){
        var $ = S.all;
        new ImageDD(box, imageSelector);
    })
```

index | code | desc
------------ | ------------- | -------------
1 | 
```javascript
    new ImageDD($(boxId));
```
| box 下所有的<img>（容器事件监听），如果box 就是<img> 事件直接注册在<img>上 |
2 | 
```javascript
    new ImageDD([$(box1Id), $(box2Id)])
```
| box1, box2 下所有<img> |
3 |
```javascript
    new Image($(boxId), imageClass);
```
| box 下所有<img class=imageClass>的才触发组件功能 |
4 |
```javascript
    var imageDD = new ImageD();
    imageDD.add();
```
| 提供add方法，参数说明同 new Image();中的参数 |