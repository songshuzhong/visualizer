/**
 Version v0.0.4
 User songshuzhong@bonc.com.cn
 ------------------------------------------------------------
 Date         Author          Version            Description
 ------------------------------------------------------------
 2018年9月9日 songshuzhong    v0.0.4            采用sequelize持久化解决方案
 */
window.editorNodeIds = [];
window. editorNodeRes = [];

function initLayout( pageModel ) {
  if ( pageModel ) {
    var pageText = pageModel.pageText;
    var pageJs = pageModel.pageJs;
    var pageStyle = pageModel.pageStyle;

    $( '#v-main-container' ).html( pageText );
    $( '#v-pureHtmlTemplate' ).contents().find( '#v-main-container' ).html( pageText );
    $( 'head' ).append( $( pageStyle.trim() ) );
    $( 'body' ).append( $( pageJs.trim() ) );
  }
}

function saveLayout( target ) {
  if ( target ) {
    var jss = "";
    var css = "";
    $( 'head link').each( function( index, cs ) { if ( cs.getAttribute( 'id' ) ) { css += cs.outerHTML; } } );
    $( 'head style').each( function( index, cs ) { if ( cs.getAttribute( 'id' ) ) { css += cs.outerHTML; } } );
    $( 'body script' ).each( function( index, js ) { if( js.getAttribute( 'id' ) ){ jss += js.outerHTML; } } );
  }
}

function cleanLayout( e ) {
  if ( e ) {
    var tag = findParentDragHelper( e );
    $( '#v-pureHtmlTemplate' ).contents().find( '[data-uuid="' + tag.getAttribute( 'data-uuid' ) + '"]'  ).remove();
    $( '[data-uuid="' + tag.getAttribute( 'data-uuid' ) + '"]' ).remove();
    $( '#' + tag.getAttribute( 'data-uuid' ) + 'cs' ).remove();
    $( '#' + tag.getAttribute( 'data-uuid' ) + 'js' ).remove();
    try {
      var nodeRes = tag.getAttribute( 'data-moduleres' );
      if ( nodeRes ) {
        nodeRes.split( ',' ).map( res => res.split( ':' ) ).forEach( function( node ) {
          var count = $( '#' + node[1] ).attr( 'data-count' );
          Number( count )? $( '#' + node[1] ).attr( 'data-count', --count ): $( '#' + node[1] ).remove();
        } );
      }
    } catch( e ) {
      alert( e.toString() );
    } finally {
      window.editorNodeRes = []; window.editorNodeIds = [];
    }
  } else {
    var jss = $( 'script' );
    var css = $( 'style' );

    for ( var i = 0, length = jss.length; i < length; i++ ) {
      if ( $( jss[ i ] ).attr( 'id' ) && $( jss[ i ] ).attr( 'id' ) ) {
        $( jss[ i ] ).remove();
      }
    }
    for ( var i = 0, length = css.length; i < length; i++ ) {
      if ( $( css[ i ] ).attr( 'id' ) && $( css[ i ] ).attr( 'id' ) ) {
        $( css[ i ] ).remove();
      }
    }

    css = $( 'link' );
    for ( var i = 0, length = css.length; i < length; i++ ) {
      if ( $( css[ i ] ).attr( 'id' ) && $( css[ i ] ).attr( 'id' ) ) {
        $( css[ i ] ).remove();
      }
    }

    $( '#v-main-container' ).empty();
    $( '#v-pureHtmlTemplate' ).contents().find( '#v-main-container' ).empty();
  }

  window.preparedTarget = null;
  $( '#v-toolbar' ).css( 'display', 'none' );
  saveLayout( e  );
}

function purifyLayout() {
  var t = $( '#v-pureHtmlTemplate' ).contents().find( '#v-main-container' ).clone();

  t.find( '#view-editor' ).each( function() { cleanSelf( this ) } );

  delUUID( t[ 0 ] );

  return t.html();
}

function collectHtml( e ) {
  var target = null;

  if ( e ) {
    target = findParentDragHelper( e ).getAttribute( 'data-uuid' );
    target = $( '#v-pureHtmlTemplate' ).contents().find( '[data-uuid="' + target + '"]' ).prop( 'outerHTML' );
  } else {
    target = $( '#v-pureHtmlTemplate' ).contents().find( '#v-main-container' ).html();
  }

  try {
    return target.trim();
  } catch( e ) {
    alert( '获取元素失败，请重新打开编辑页面！' );
  }
}

function collectStylesheet() {
  var stylesheets = $( "style" );
  var purifyStylesheet = "";
  var purifyStyleHref = "";
  var ids = "";
  for( var i = 0, length = stylesheets.length; i < length; i++ ) {
    if ( stylesheets[ i ].getAttribute( 'id' ) && !ids.includes( stylesheets[ i ].getAttribute( 'id' ) ) ) {
      ids += stylesheets[ i ].getAttribute( 'id' );
      purifyStylesheet += stylesheets[ i ].outerHTML + '\r\n';
    }
  }
  stylesheets = $( 'link' );
  for ( var i = 0, length = stylesheets.length; i < length; i++ ) {
    if ( stylesheets[ i ].getAttribute( 'id' ) && !ids.includes( stylesheets[ i ].getAttribute( 'id' ) ) ) {
      ids += stylesheets[ i ].getAttribute( 'id' );
      purifyStyleHref += '<link rel="stylesheet" id="' + stylesheets[ i ].getAttribute( 'id' ) + '" href="' + stylesheets[ i ].getAttribute( 'href' ) + '">';
    }
  }

  return purifyStylesheet + purifyStyleHref;
}

function collectJavascript() {
  var javascripts = $( "script" );
  var purifyJavascript = "";
  var purifyScriptSrc = "";
  var ids = "";
  for ( var i = 0, length = javascripts.length; i < length; i++ ) {
    if ( javascripts[ i ].getAttribute( 'id' ) && !ids.includes( javascripts[ i ].getAttribute( 'id' ) ) ) {
      if ( !javascripts[ i ].getAttribute( 'src' )) {
        ids += javascripts[ i ].getAttribute( 'id' );
        purifyJavascript += javascripts[ i ].outerHTML + '\r\n';
      } else {
        purifyScriptSrc += '<script type="text/javascript" id="' + javascripts[ i ].getAttribute( 'id' ) + '" data-count="'+ javascripts[ i ].getAttribute( 'data-count' ) +'" src="' + javascripts[ i ].getAttribute( 'src' ) + '"><\/script>\r\n';
      }
    }
  }
  return purifyScriptSrc + purifyJavascript;
}

function collectNodesRes( e ) {
  function getChildNode( node ) {
    if ( node && node.nodeType === 1 ) {
      if ( /^[a-zA-Z0-9]{10}$/.test( node.id ) ) {
        window.editorNodeIds.push( node.id );
        var nodeRes = node.getAttribute( 'data-moduleres' );
        if ( nodeRes ) {
          nodeRes = nodeRes.split( ',' ).map( res => { return res.split( ':' )[ 1 ] } );
          for ( var i = 0, length = nodeRes.length; i < length; i++ ) {
            if ( !window.editorNodeRes.includes( nodeRes[ i ] ) ) {
              window.editorNodeRes.push( nodeRes[ i ] );
            }
          }
        }
      }
    }

    var childNodes = node? node.childNodes: [];
    for ( var i = 0, length = childNodes.length; i < length; i++ ) {
      getChildNode( childNodes[ i ] );
    }
  }

  var node = findParentDragHelper( e );
  getChildNode( node )
}

function mergeNodeBeforeEdit( e ) {
  var node = $( collectHtml( e ) );
  var editorNodeRes = window.editorNodeRes;
  var res = null;
  try{ res = JSON.parse( node.attr( 'data-moduleres' ) ); }catch( e ){ res = [] };

  for ( var i = 0, length = res.length; i < length; i++ )
    if (JSON.stringify(editorNodeRes).indexOf(JSON.stringify(res[i])) === -1) {
      editorNodeRes.push(res[i]);
    }

  node.attr( 'data-moduleres', JSON.stringify( editorNodeRes ) );
  node.find( '#view-editor' ).each( function( index ) { index > 0? cleanSelf( this ): null } );
  return node.prop( 'outerHTML' );
}

function initEditorial( e ) {
  var preparedTarget = findParentDragHelper( e );
  var id = preparedTarget.getAttribute( 'data-uuid' );
  var eJs = $( '#' + id + 'js' ).html() || '';
  var eCs = $( '#' + id + 'cs' ).html() || '';
  var eText = $( '#v-pureHtmlTemplate' ).contents().find( '[data-uuid="' + id + '"]' ).prop( 'outerHTML' );
  editorialJsHelper.setValue( eJs );
  editorialCsHelper.setValue( eCs );
  editorialHtmlHelper.setValue( eText );
  window.preparedTarget = preparedTarget;
}

function onLayoutEdit( e ) {
  initEditorial( e );
  $( '#v-toolbar' ).css( 'display', 'none');
  $( '#v-editorModal' ).modal( 'show' );

  CodeMirror.commands["selectAll"]( editorialHtmlHelper );
  CodeMirror.commands["selectAll"]( editorialJsHelper );
  CodeMirror.commands["selectAll"]( editorialCsHelper );

  editorialHtmlHelper.autoFormatRange( editorialHtmlHelper.getCursor( true ), editorialHtmlHelper.getCursor( false ) );
  editorialJsHelper.autoFormatRange( editorialJsHelper.getCursor( true ), editorialJsHelper.getCursor( false ) );
  editorialCsHelper.autoFormatRange( editorialCsHelper.getCursor( true ), editorialCsHelper.getCursor( false ) );

  var timer = setTimeout(function() { editorialHtmlHelper.refresh(); clearTimeout( timer ); }, 500 );
}

function saveEditorial() {
  var editorNodeIds = window.preparedTarget.getAttribute( 'data-uuid' );
  var mainCs = $( '#' + editorNodeIds + 'cs' );
  var mainJs = $( '#' + editorNodeIds + 'js' );
  var eCs = editorialCsHelper.getValue();
  var eJs = editorialJsHelper.getValue();
  var eText = editorialHtmlHelper.getValue();

  $( '#v-pureHtmlTemplate' ).contents().find( '[data-uuid="' + editorNodeIds + '"]' ).replaceWith( eText );
  $( '#v-main-container' ).find( '[data-uuid="' + editorNodeIds + '"]' ).replaceWith( eText );
  mainJs.remove();
  mainCs.remove();

  try {
    if ( eJs ) {
      $( 'body' ).append( $( "<script id='" + editorNodeIds + "js'>" + eJs + "<\/script>" ) );
    }
    if ( eCs ) {
      $( 'head' ).append( $( "<style id='" + editorNodeIds + "cs'>" + eCs + "<\/style>" ) );
    }
  } catch( e ) {
    mainJs.remove();
    mainCs.remove();
    var shareModal = $( '#v-shareModal' );
    shareModal.find( '.modal-header' ).html( '保存错误，请按照提示修正代码！' );
    shareModal.find( '.modal-body' ).html( '提示：' + e.message );
    shareModal.modal( 'show' );
    return null;
  }

  $( '#previewHtml' ).html( '' );
  $( '#previewJs' ).html( '' );
  $( '#previewCss' ).html( '' );
  $( '#v-editorModal' ).modal( 'hide' );
  $( '.drop-helper' ).sortable( { opacity: .35, connectWith: '.drop-helper', handle: '.drag-helper' } );

  window.editorNodeIds = [];
  window.editorNodeRes = [];
  window.preparedTarget = null;
}
