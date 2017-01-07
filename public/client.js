// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  var sample = $('#samples').text().trim();
  var $window = $(window);
  var $editor = $('#editor');
  var $iFormat = $('input[name="format"]');
  var $iLayout = $('input[name="layout"]');
  var $iUrl = $('input.url');
  var $link = $('a.download');
  
  var editor = CodeMirror($editor.get(0), {
    value: sample,
    mode : '',
    lineNumbers: true,
    viewportMargin: Infinity
  });

  // value change -> render
  editor.on('changes', render);
  // change format -> render
  $iFormat.click(render);
  // change layout -> render
  $iLayout.click(render);  
  
  editor.focus();
  render(sample);
  
  $window.resize(resize);
  resize();
  
  // select all url on click
  $iUrl.click(function () {
    $(this).select();
  });
  
  /**
   *  Render graphviz
   */
  function render() {
    var format = $iFormat.filter(':checked').val() || 'svg';
    var layout = $iLayout.filter(':checked').val() || 'dot';
    var graph = editor.getValue();
    var graphImg = '/graphviz?layout='+ layout +'&format='+ format +'&mode=download&graph='+ encodeURIComponent(graph);
    $('#graph').empty().append('<img src="'+ graphImg +'">');
    $iUrl.val($('#graph img').prop('src'));
    $link.attr('href', graphImg);
  }
  
  /**
   * Resize editor
   */
  function resize() {
    $editor.height($window.height());
    editor.setSize($editor.width(), $window.height());
  }
});