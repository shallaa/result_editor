var ResultEditor = (function() {
  var TextItem = (function() {
    var TextItem, fn;

    TextItem = function(options) {
      this.constructor.call(this);

      this.options = _.extend({
        text: 'This is TEST',
        font: '40px Dotum',
        color: '#DEDEDE',
        x: 0,
        y: 0
      }, options);

      this.zone = new createjs.Shape();
      this.zone.alpha = 0.01;
      this.addChild(this.zone);

      this.text = new createjs.Text(this.options.text, this.options.font, this.options.color);
      this.addChild(this.text);

      this.mouseChildren = false;
      this.cursor = 'move';

      this.on('mousedown', function(e) {
        var sx = this.x - e.stageX;
        var sy = this.y - e.stageY;
        var moveListener;
        var upListener;

        this.parent.setChildIndex(this, this.parent.numChildren - 1);

        moveListener = this.on('pressmove', function(e) {
          this.setTransform(e.stageX + sx, e.stageY + sy);
        }, this);

        upListener = this.on('pressup', function() {
          this.off('pressmove', moveListener);
          this.off('pressup', upListener);

          this.options.x = this.x;
          this.options.y = this.y;
          this.dispatchEvent('positionChanged');
        }, this);
      }, this);

      this.updateSize();
    };

    fn = TextItem.prototype = new createjs.Container;

    fn.updateSize = function() {
      var bounds = this.text.getBounds();
      this.zone.graphics
        .clear()
        .beginFill('white')
        .drawRect(bounds.x, bounds.y, bounds.width, bounds.height)
        .endFill();
    };

    return TextItem;
  })();

  var renderList = [];
  var renderStage = function() {
    var i = renderList.length;

    while(i--){
      renderList[i].stage.update();
    }
  };

  var renderInterval = null;

  var ResultEditor = Backbone.View.extend({

    initialize: function(options) {
      console.log('initialize');

      renderList.push(this);

      this.model = new Backbone.Model(_.extend({
        image: '',
        imageWidth: 0,
        imageHeight: 0,
        texts: []
      }, options));

      this.canvas = document.createElement('canvas');
      this.stage = new createjs.Stage(this.canvas);
      this.stage.autoClear = false;
      this.stage.enableMouseOver(50);

      this.image = new Image();
      this.imageBitmap = null;
      this.texts = [];

      this.listenTo(this.model, 'change', this.render);

      if(!renderInterval) {
        createjs.Ticker.framerate = 30;
        createjs.Ticker.timingMode = createjs.Ticker.TIMEOUT;
        renderInterval = createjs.Ticker.addEventListener('tick', renderStage);
      }
    },

    render: function() {
      console.log('render');

      this.$el.append(this.canvas);

      var canvas = this.canvas;
      var width = this.model.get('imageWidth');
      var height = this.model.get('imageHeight');

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      var _this = this;

      this.stage.removeChild(this.imageBitmap);
      this.imageBitmap = null;

      _.each(this.texts, function(text) {
        _this.stage.removeChild(text);
        text.removeAllEventListeners();
        text = null;
      });

      this.texts.length = 0;

      this.image.onload = function() {
        _this.imageBitmap = new createjs.Bitmap(_this.image);
        _this.stage.addChildAt(_this.imageBitmap, 0);
      };
      this.image.src = this.model.get('image');

      var textItem;
      var id = 0;

      _.each(this.model.get('texts'), function(text) {
        if(!text.id) text.id = (id++);

        textItem = new TextItem(text);
        textItem.setTransform(text.x, text.y);
        textItem.addEventListener('positionChanged', function(e) {
          _this.changeText(e.target.options, false);
        });

        _this.stage.addChild(textItem);
        _this.texts.push(textItem);
      });

      return this;
    },

    getResultData: function() {
      return JSON.stringify(this.model);
    },

    addText: function(text) {
      var items = this.model.get('texts');

      items.push(text);

      this.model.set({texts: items});
      this.model.trigger('change');
    },

    removeText: function(id) {
      var items = this.model.get('texts');

      var itemsNew = _.reject(items, function(item) {
        return item.id == id;
      });

      this.model.set({texts: itemsNew});
    },

    changeText: function(text, update) {
      var items = this.model.get('texts');

      _.each(items, function(item) {
        if(item.id == text.id){
          if(text.text) item.text = text.text;
          if(text.font) item.font = text.font ;
          if(text.color) item.color = text.color;
          if(text.x) item.x = text.x;
          if(text.y) item.y = text.y;
        }
      });

      this.model.set({texts: items});

      if(update != false) {
        this.model.trigger('change');
      }
    },

    changeImage: function(image) {
      if(typeof image !== 'undefined' && this.model.get('image') != image) {
        this.model.set({image: image});
      }
    },

    changeSize: function(width, height) {
      var size = {};

      if(width) {
        size.imageWidth = width;
      }

      if(height) {
        size.imageHeight = height;
      }

      this.model.set(size);
    }
  });

  return ResultEditor;
})();