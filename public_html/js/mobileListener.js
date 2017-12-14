var input = document.querySelector('#search'),
    oldValue,
    oldCursor,
    regex = new RegExp(/^\d{0,16}$/g),
    mask = function(value) {
      var output = [];
        for(var i = 0; i < value.length; i++) {
          if(i !== 0 && i % 4 === 0) {
            output.push(" "); // add the separator
          }
          output.push(value[i]);
        }
        return output.join("");
    },
    unmask = function(value) {
      var output = value.replace(new RegExp(/[^\d]/, 'g'), ''); // Remove every non-digit character
      return output;
    },
    checkSeparator = function(position, interval) {
      return Math.floor(position / (interval + 1));
    },
    keydownHandler = function(e) {
      var el = e.target;
      
      oldValue = el.value;
      oldCursor = el.selectionEnd;
    },
    inputHandler = function(e) {
      var el = e.target,
          newCursorPosition,
          newValue = unmask(el.value)
      ;
      
      if(newValue.match(regex)) {
        newValue = mask(newValue);
        
        newCursorPosition = oldCursor - checkSeparator(oldCursor, 4) + checkSeparator(oldCursor + (newValue.length - oldValue.length), 4) + (unmask(newValue).length - unmask(oldValue).length);
                
        if(newValue !== "") {
          el.value = newValue;
        } else {
          el.value = "";
        }
      } else {
        el.value = oldValue;
        newCursorPosition = oldCursor;
      }
      el.setSelectionRange(newCursorPosition, newCursorPosition);
    }
;

input.addEventListener('keydown', keydownHandler);
input.addEventListener('input', inputHandler);