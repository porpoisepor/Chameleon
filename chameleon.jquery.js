/* Chameleon: */
(function($) {
  $.fn.chameleon = function (data) {
    var element = $(this);
    var mirror = data.mirror;
    var result = {};
    var mirrorStyle = css($(mirror));
    
    
    
    /* Defaults */
    if(data.colorContrast === undefined)
      data.colorContrast = true;
      
    if(data.inheritAll === undefined)
      data.inheritAll = false;
      
      

    if(!$(this).hasClass('chameleon-listener')){
      $(mirror).attrchange({
        callback: function(){
          setTimeout(function(){
            element.chameleon({
              mirror: mirror,
              inheritAll: data.inheritAll,
              colorContrast: data.colorContrast,
              set: data.set
            });
          }, 150);
        }
      });
      
      $(this).addClass('chameleon-listener');
    }


    return this.each(function(){
      if (data.inheritAll === true) {
        $(this).css(mirrorStyle);
      } else {
        for (prop in data.set) {
          if(result.backgroundColor && data.colorContrast){
            if(prop === 'color'){
              result[prop] = getContrast($(mirror).css(data.set[prop]));
            }
          } else {
            result[prop] = $(mirror).css(data.set[prop]);
          }
        }
        $(this).css(result);
      }
    });
  };
})(jQuery);


function getContrast(rgb) {
  /* rgb = 'rgb(255, 0, 0)' -> Example */
  var removeRGB = /\(([^)]+)\)/;
  var cleanRGB = removeRGB.exec(rgb); /* Removes the rgb() part of the string */
  
  /* rgb = ['(255, 0, 0)', '255, 0, 0'] */
  var splitRGB = cleanRGB[1].split(', '); /* Put the red, green and blue numbers into an array */
  
  /* rgb = [255, 0, 0] */
  var r = splitRGB[0],
      g = splitRGB[1],
      b = splitRGB[2],
      yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000' : '#fff';
}


/* Stack Overflow:
*    http://stackoverflow.com/questions/754607/can-jquery-get-all-css-styles-associated-with-an-element
*
*  Used to get all the styles of an element
*/
function css(a) {
  var sheets = document.styleSheets, o = {};
  for (var i in sheets) {
    var rules = sheets[i].rules || sheets[i].cssRules;
    for (var r in rules) {
      if (a.is(rules[r].selectorText)) {
        o = $.extend(o, css2json(rules[r].style), css2json(a.attr('style')));
      }
    }
  }
  return o;
}

function css2json(css) {
  var s = {};
  if (!css) return s;
  if (css instanceof CSSStyleDeclaration) {
    for (var i in css) {
      if ((css[i]).toLowerCase) {
        s[(css[i]).toLowerCase()] = (css[css[i]]);
      }
    }
  } else if (typeof css == "string") {
    css = css.split("; ");
    for (var i in css) {
      var l = css[i].split(": ");
      s[l[0].toLowerCase()] = (l[1]);
    }
  }
  return s;
}

/*
A simple jQuery function that can add listeners on attribute change.
http://meetselva.github.io/attrchange/
About License:
Copyright (C) 2013-2014 Selvakumar Arumugam
You may use attrchange plugin under the terms of the MIT Licese.
https://github.com/meetselva/attrchange/blob/master/MIT-License.txt
 */
(function($) {
  function isDOMAttrModifiedSupported() {
    var p = document.createElement('p');
    var flag = false;

    if (p.addEventListener) {
      p.addEventListener('DOMAttrModified', function() {
        flag = true
      }, false);
    } else if (p.attachEvent) {
      p.attachEvent('onDOMAttrModified', function() {
        flag = true
      });
    } else { return false; }
    p.setAttribute('id', 'target');
    return flag;
  }

  function checkAttributes(chkAttr, e) {
    if (chkAttr) {
      var attributes = this.data('attr-old-value');

      if (e.attributeName.indexOf('style') >= 0) {
        if (!attributes['style'])
          attributes['style'] = {}; //initialize
        var keys = e.attributeName.split('.');
        e.attributeName = keys[0];
        e.oldValue = attributes['style'][keys[1]]; //old value
        e.newValue = keys[1] + ':'
            + this.prop("style")[$.camelCase(keys[1])]; //new value
        attributes['style'][keys[1]] = e.newValue;
      } else {
        e.oldValue = attributes[e.attributeName];
        e.newValue = this.attr(e.attributeName);
        attributes[e.attributeName] = e.newValue;
      }

      this.data('attr-old-value', attributes); //update the old value object
    }
  }

  //initialize Mutation Observer
  var MutationObserver = window.MutationObserver
      || window.WebKitMutationObserver;

  $.fn.attrchange = function(a, b) {
    $(this).addClass('chameleon-listener');
    if (typeof a == 'object') {//core
      var cfg = {
        trackValues : false,
        callback : $.noop
      };
      //backward compatibility
      if (typeof a === "function") { cfg.callback = a; } else { $.extend(cfg, a); }

      if (cfg.trackValues) { //get attributes old value
        this.each(function(i, el) {
          var attributes = {};
          for ( var attr, i = 0, attrs = el.attributes, l = attrs.length; i < l; i++) {
            attr = attrs.item(i);
            attributes[attr.nodeName] = attr.value;
          }
          $(this).data('attr-old-value', attributes);
        });
      }

      if (MutationObserver) { //Modern Browsers supporting MutationObserver
        var mOptions = {
          subtree : false,
          attributes : true,
          attributeOldValue : cfg.trackValues
        };
        var observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(e) {
            var _this = e.target;
            //get new value if trackValues is true
            if (cfg.trackValues) {              
              e.newValue = $(_this).attr(e.attributeName);
            }           
            if ($(_this).data('attrchange-status') === 'connected') { //execute if connected
              cfg.callback.call(_this, e);
            }
          });
        });

        return this.data('attrchange-method', 'Mutation Observer').data('attrchange-status', 'connected')
            .data('attrchange-obs', observer).each(function() {
              observer.observe(this, mOptions);
            });
      } else if (isDOMAttrModifiedSupported()) { //Opera
        //Good old Mutation Events
        return this.data('attrchange-method', 'DOMAttrModified').data('attrchange-status', 'connected').on('DOMAttrModified', function(event) {
          if (event.originalEvent) { event = event.originalEvent; }//jQuery normalization is not required 
          event.attributeName = event.attrName; //property names to be consistent with MutationObserver
          event.oldValue = event.prevValue; //property names to be consistent with MutationObserver
          if ($(this).data('attrchange-status') === 'connected') { //disconnected logically
            cfg.callback.call(this, event);
          }
        });
      } else if ('onpropertychange' in document.body) { //works only in IE    
        return this.data('attrchange-method', 'propertychange').data('attrchange-status', 'connected').on('propertychange', function(e) {
          e.attributeName = window.event.propertyName;
          //to set the attr old value
          checkAttributes.call($(this), cfg.trackValues, e);
          if ($(this).data('attrchange-status') === 'connected') { //disconnected logically
            cfg.callback.call(this, e);
          }
        });
      }
      return this;
    } else if (typeof a == 'string' && $.fn.attrchange.hasOwnProperty('extensions') &&
        $.fn.attrchange['extensions'].hasOwnProperty(a)) { //extensions/options
      return $.fn.attrchange['extensions'][a].call(this, b);
    }
  }
})(jQuery);


