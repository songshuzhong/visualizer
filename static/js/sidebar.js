/**
 Version v0.0.5
 User songshuzhong@bonc.com.cn
 ------------------------------------------------------------
 Date         Author          Version            Description
 ------------------------------------------------------------
 2018年9月14日 songshuzhong   v0.0.5            重构代码结构、采用html5原生拖放api
 */
$(function () {
  window.resCachedList = { js: [], cs: [] };
  $( document ).on( 'click', '.v-sidebar-menu li', function( e ) {
    var li = $( e.currentTarget );
    var ul = $( e.currentTarget ).children( 'ul' );
    if ( !ul.children().length ) {
      fetchDataById( li.attr( 'id' ), ul );
    }
    if ( li.hasClass( 'active' ) ) {
      li.removeClass( 'active' );
    } else {
      li.parents( 'ul' ).first().find( 'li.active' ).removeClass( 'active' );
      li.addClass( 'active' );
    }
    e.stopPropagation();
  } );
  $( document ).on( 'click', '.navbar-nav .glyphicon-align-justify', function( e ) {
    var v_main_sidebar = $( '.v-main-sidebar' );
    var v_main_container = $( '.container.drop-helper-container' );
    if ( v_main_sidebar.css( 'width' ) === '0px' ) {
      v_main_sidebar.css( 'width', '230px' );
      v_main_container.css( 'padding-left', '235px' );
    } else {
      v_main_sidebar.css( 'width', 0 );
      v_main_container.css( 'padding-left', '10px' );
    }
  } );
  $( document ).on( 'click', '.v-toolBar .glyphicon-trash', function( e ){ cleanLayout( e ) } );
  $( document ).on( 'click', '.v-toolBar .glyphicon-edit', function( e ){ onLayoutEdit( e ) } );
  $( document ).on( 'click', '#v-main-container .drag', function( e ) {
    $( this ).css( 'border', '1px #d9534f dashed' );
    if ( $( this ).find( '.v-toolBar' ).hasClass( 'active' ) ) {
      $( this ).find( '.v-toolBar' ).removeClass( 'active' );
    } else {
      $( '#v-main-container .drag' ).find( '.active' ).removeClass( 'active' );
      $( this ).find( '.v-toolBar' ).addClass( 'active' );
    }
    e.stopPropagation();
  } );
  $( document ).on( 'mouseover', '#v-main-container .drag', function( e ) {
    $( this ).css( 'border', '1px #428bca dashed' );
    e.stopPropagation();
  } );
  $( document ).on( 'mouseout', '#v-main-container .drag', function( e ) {
    $( this ).css( 'border', '' );
  } );
  $( '.glyphicon-off' ).click( function() { $( '#v-toolbar' ).css( 'display', 'none' ); } );
  $( '#v-previewTabs a' ).click(function ( e ) {
    e.preventDefault();
    $( this ).tab( 'show' );
    var timer = setTimeout(function() {
      switch( e.currentTarget.text ) {
        case 'HTML': editorialHtmlHelper.refresh(); break;
        case 'CS': editorialCsHelper.refresh(); break;
        case 'JS': editorialJsHelper.refresh(); break;
      }
      clearTimeout( timer );
    }, 500 );
  });
  $( '#v-module-search' ).click( function () {
    var keyword = $( 'input[name=moduleName]' ).val();
    var container = $( '#v-side-bar-menu' );

    if ( keyword ) {
      fetchDataByKeyword( '%' + keyword + '%', container )
    } else {
      fetchDataById( 'root', container );
    }
    container.empty();
    return false;
  } );
  $( '#v-cleanLayout' ).click( function(){ cleanLayout() } );
  $( '#v-savePageModel' ).click( function( e ){ savePageModel( e ) } );
  $( '#v-closeEditorial' ).click( function( e ){ saveEditorial( e ) } );
  $( '#v-saveEditorial' ).click( function( e ){ saveEditorial( e ) } );
  $( '#v-pureHtmlTemplate' ).contents().find( 'body' ).html( '<div id="v-main-container" data-uuid="container" />' );
  bindDroppable();
  fetchDataById( 'root', document.getElementById( 'v-side-bar-menu' ) );
  //initLayout( pageModel );
} );

function fetchDataByKeyword( keyword, container ) {
  $.ajax( {
    type: 'POST',
    url: apiPath + version + '/api/pageModule/module/search/detail',
    data: { moduleName: keyword },
    success: function ( data ) {
      renderMenuList( data, container );
    },
    error: function ( e ) { alert( '服务器出错，返回内容：' + e.responseText ) }
  } );
}

function fetchDataById( moduleTypeId, container ) {
  $.ajax( {
    url: apiPath + version + '/api/pageModule/module/detail/' + moduleTypeId,
    type: 'GET',
    success: function ( data ) {
      renderMenuList( data, container );
    },
    error: function ( e ) { alert( '服务器出错，返回内容：' + e.responseText ) }
  } );
}

function renderMenuList( data, container ) {
  var nodes = data.nodes;
  var pageModuleList = data.pageModuleList;

  nodes.forEach( ( node ) => { var li = createStaticLi( node ); $( li ).appendTo( container ); } );

  pageModuleList.forEach( ( pageModule ) => { var li = createMovableLi( pageModule ); $( li ).appendTo( container ); bindDraggable(); } );
}

function createMovableLi( pageModule ) {
  var li = $(
    '<li id="' + pageModule.moduleId + '" class="v-treeview">'+
    '  <div class="drag">' +
    '    <a id="' + pageModule.moduleTypeId + '" data-container="drag-helper" data-toggle="tooltip" data-placement="right" title="' + pageModule.moduleTip + '">' +
    '      <i class="glyphicon glyphicon-object-align-horizontal v-angle"></i>' +
    '      <span>' + pageModule.moduleName + '</span>' +
    '      <i class="drag-helper glyphicon glyphicon-move v-angle-right"></i>' +
    '    </a>' +
    '    <div class="view">' + pageModule.moduleText + '</div>' +
    '  </div>' +
    '</li>');

  pageModule.pageResIds = pageModule.pageRes&&pageModule.pageRes.reduce(function( total, currentValue ){ return total + currentValue.resType + ':' + currentValue.resName + ':' + currentValue.resId + ',' }, '');

  $( li ).children( '.drag' )
    .attr( 'data-moduletext', pageModule.moduleText )
    .attr( 'data-modulecs', pageModule.moduleStyle )
    .attr( 'data-modulejs', pageModule.moduleJs )
    .attr( 'data-moduleres', pageModule.pageResIds );

  if ( pageModule.moduleText.trim().includes( 'force drop' ) )
    $( li ).children( '.drag' ).removeClass( 'drag' ).addClass( 'force drag' );
  else if ( pageModule.moduleText.trim().includes( 'normal drop' ) )
    $( li ).children( '.drag' ).removeClass( 'drag' ).addClass( 'normal drag' );
  else
    $( li ).children( '.drag' ).removeClass( 'drag' ).addClass( 'weak drag' );
  return li;
}

function createStaticLi( node ) {
  var li = $( '<li id="' + node.moduleTypeId + '" class="v-treeview"></li>');
  $(li).append('<a><i class="glyphicon glyphicon-gift v-angle"></i>' + node.moduleTypeName + '<i class="glyphicon glyphicon-menu-right v-angle-right"></i></a>');
  $( '<ul class="v-treeview-menu"></ul>' ).appendTo( li );
  return li;
}

function bindDraggable() {
  $( '.v-sidebar-menu .drag' ).draggable( {
    zIndex: 999,
    revert: false,
    helper: 'clone',
    appendTo: 'body',
    handle: '.drag-helper',
    connectToSortable: '.drop-helper-container',
    drag: function( e, t ) { t.helper.width( 400 ) }
  } );
}

function bindInnerDraggable() {
  $( '#v-main-container .innerDrag' ).draggable( {
    zIndex: 999,
    revert: false,
    appendTo: 'body',
    handle: '.glyphicon-move',
    connectToSortable: '.drop-helper-container',
    drag: function( e, t ) { t.helper.width( 400 ) }
  } );
}

function bindDroppable() {
  $( '.drop-helper-container, .drop-helper-container .drop-helper' ).sortable({
    connectWith: '.drop-helper',
    opacity: .35,
    handle: ".drag-helper",
  } ).on( 'sortstart', function( e, t ) {
    if ( ! t.item.attr( 'class' ).includes( 'innerDrag' ) ) {
      convertTagsId( e, t );
      addResScript( e, t );
    }
  } ).on( 'sortstop', function( e, t ) {
    if ( isDraggableValid( e, t ) ) {
      if ( ! t.item.attr( 'class' ).includes( 'innerDrag' ) ) {
        updateTemplateFrame( e, t );
        addScriptAndStyle( e, t );
      } else {
        $( 'div[data-uuid="'+ t.item.attr( 'data-uuid' ) +'"]' ).removeAttr( 'style' ).removeClass( 'ui-draggable-dragging' );
        updateInnerTemplateFrame( e, t );
      }
      bindInnerDraggable();
    } else {
      isDraggableInvalid();
      if ( ! t.item.attr( 'class' ).includes( 'innerDrag' ) ) {
        t.item.remove();
        removeScriptAndStyle( e, t );
      }
    }
  } );
}

function isDraggableValid( e, t ) {
  var targetClassName = t.item.attr( 'class' );
  var containerClassName = t.item.parent().attr( 'class' );

  if ( targetClassName.includes( 'force drag' ) && ( containerClassName.includes( 'drop-helper-container' ) || containerClassName.includes( 'force' ) || containerClassName.includes( 'normal' ) ) ) {
    return true;
  } else if ( targetClassName.includes( 'normal drag' ) && containerClassName.includes( 'force' ) ) {
    return true;
  } else if ( targetClassName.includes( 'normal drag' ) && containerClassName.includes( 'normal' ) ) {
    return true;
  } else if ( targetClassName.includes( 'weak drag' ) && ( containerClassName.includes( 'force' ) || containerClassName.includes( 'normal' ) ) ) {
    return true;
  } else {
    return false;
  }
}

function isDraggableInvalid() {
  $( document.body ).append(
    '<div id="isDraggableInvalid" class="alert alert-danger fade in" style="position: absolute;bottom: 0;z-index: 999999;width: 100%;margin-bottom: 0;">' +
    '  <a href="#" class="close" data-dismiss="alert">&times;</a>' +
    '  <strong>警告！</strong>本次拖放违反组件嵌套规则。请选择正确的父级容器。' +
    '</div>'
  );
  var isInvalidTimer = setTimeout(function(){ $( '#isDraggableInvalid' ).alert( 'close' ); clearTimeout( isInvalidTimer ) }, 3500 );
}

function convertTagsId( e, t ) {
  var cs = t.item.attr( 'data-modulecs' );
  var js = t.item.attr( 'data-modulejs' );
  var text = $( t.item.attr( 'data-moduletext' ).trim() )[0];
  var dropHelper = $( text ).find( '.drop-helper' ).attr( 'class' );

  dropHelper? dropHelper.includes( 'force' )? dropHelper = 'force drag': dropHelper.includes( 'normal' )? dropHelper = 'normal drag': dropHelper = 'weak drag': dropHelper = 'weak drag';

  signUUID( text );
  text = '<div class="innerDrag ' + dropHelper + '" data-uuid="' + getUUID() + '">' +
    '  <div class="v-toolBar">' +
    '    <a href="#">' +
    '      <i class="glyphicon glyphicon-move"></i>&nbsp;' +
    '    </a>' +
    '    <a href="#">' +
    '      <i class="glyphicon glyphicon-trash"></i>&nbsp;' +
    '    </a>' +
    '    <a href="#">' +
    '      <i class="glyphicon glyphicon-edit"></i>&nbsp;' +
    '    </a>' +
    '    <a href="#">' +
    '      <i class="glyphicon glyphicon-duplicate"></i>&nbsp;' +
    '    </a>' +
    '  </div>' + text.outerHTML +
    '</div>';

  for ( var i = 0; ; i++ ) {

    if ( text.includes( 'TEMPLATE_ID_' + i ) ) {
      var id = getUUID();
      text = text.replace( new RegExp( 'TEMPLATE_ID_' + i, 'gm' ), id );
      if ( js.includes( 'TEMPLATE_ID_' + i ) )
        js = js.replace( new RegExp( 'TEMPLATE_ID_' + i, 'gm' ), id );
      if ( cs.includes( 'TEMPLATE_ID_' + i ) )
        cs = cs.replace( new RegExp( 'TEMPLATE_ID_' + i, 'gm' ), id );
    } else { break; }
  }

  t.item.attr( 'id', getUUID() );
  t.item.attr( 'data-modulecs', cs );
  t.item.attr( 'data-modulejs', js );
  t.item.attr( 'data-moduletext', text );
  t.item.find( 'a[data-container="drag-helper"]' ).each( function() { cleanSelf( this ) } );
}

function addScriptAndStyle( e, t ) {
  var id = $( t.item.attr( 'data-moduletext' ).trim() ).attr( 'data-uuid' );
  var moduleJs = t.item.attr( 'data-modulejs' );
  var moduleStyle = t.item.attr( 'data-modulecs' );
  var shareModal = $( '#v-shareModal' );

  t.item.removeAttr( 'data-modulejs' ).removeAttr( 'data-modulecs' ).removeAttr( 'data-moduletext' );

  if ( !$( id + 'js' ).length && moduleJs ) {
    try {
      $( 'body' ).append( '<script id="' + id + 'js" defer>' + moduleJs + '</script>' );
    } catch( err ) {
      shareModal.find( '.modal-header' ).html( '组件js异常，本次操作将被取消！' );
      shareModal.find( '.modal-body' ).html( err.toString() );
      shareModal.modal( 'show' );
      removeScriptAndStyle( e, t );
      return;
    }
  }

  if ( !$( 'head #' + id + 'cs' ).length && moduleStyle ) {
    try {
      $( 'head' ).append( '<style id="' + id + 'cs">' + moduleStyle + '</style>' );
    } catch( err ) {
      shareModal.find( '.modal-header' ).html( '组件cs异常，本次操作将被取消！' );
      shareModal.find( '.modal-body' ).html( err.toString() );
      shareModal.modal( 'show' );
      removeScriptAndStyle( e, t );
    }
  }
}

function removeScriptAndStyle( e, t ) {
  var id = t.item.attr( 'id' );
  var res = t.item.attr( 'data-moduleres' );
  if ( res ) {
    var resIds = res.split( ',' ).map( res => { res = res.split( ':' ); return { resType: res[ 0 ], resId: res[ 2 ] } } );
    resIds.forEach( function( res ) {
      var el = $( '#' + res.resId );
      var count = Number( el.attr( 'data-count' ) );
      if ( count === 0 ) {
        el.remove();
      } else {
        el.attr( 'data-count', --count );
      }
    } );
  }
  $( '#' + id + 'js' ).remove();
}

function addResScript( e, t ) {
  var res = t.helper.attr( 'data-moduleres' );
  if ( res ) {
    var resIds = res.split( ',' ).map( res => { res = res.split( ':' ); return { resType: res[ 0 ], resName: res[ 1 ], resId: res[ 2 ] } } );
    resIds.forEach( function( res ) {
      var el = $( '#' + res.resId );
      if ( el.length === 0 ) {
        switch( res.resType ) {
          case "1":
            var tempJs = "<script id='" + res.resId + "' async type='text/javascript' data-count='0' src='" + window.ResPath[res.resName] + "'/>";
            $( 'body' ).append( tempJs );
            resCachedList.js.push( tempJs );
            break;
          case "2":
            var tempCs = "<link id='" + res.resId + "' rel='stylesheet' type='text/css' data-count='0' href='" + window.ResPath[res.resName] + "'/>";
            $( 'head' ).append( tempCs );
            resCachedList.cs.push( tempCs );
            break;
        }
      } else {
        var count = Number( el.attr( 'data-count' ) );
        el.attr( 'data-count', ++count );
      }
    } );
  }
}

function updateTemplateFrame( e, t ) {
  signUUID( t.item[0] );

  var ele = $( t.item.attr( 'data-moduletext' ).trim() )[0];
  var pureHtmlTemplate = $( '#v-pureHtmlTemplate' ).contents();
  var id = t.item.attr( 'id' );
  var prevId = findPrevSiblingTag( t.item[ 0 ] );
  var nextId = findNextSiblingTag( t.item[ 0 ] );
  var pId = findParentDropHelper( t.item[ 0 ] );

  if ( pureHtmlTemplate.find( '[data-uuid="' + id + '"]' ).length ) {
    pureHtmlTemplate.find( '[data-uuid="' + id + '"]' ).replaceWith( ele );
  } else if ( nextId && pureHtmlTemplate.find( '[data-uuid="' + nextId + '"]' ).length ) {
    var nextEle = pureHtmlTemplate.find( '[data-uuid="' + nextId + '"]' )[ 0 ];
    pureHtmlTemplate.find( '[data-uuid="' + pId + '"]' )[ 0 ].insertBefore( ele, nextEle );
  } else if ( prevId && pureHtmlTemplate.find( '[data-uuid="' + prevId + '"]' ).length ) {
    pureHtmlTemplate.find( '[data-uuid="' + prevId + '"]' ).parent().append( ele );
  }  else {
    pureHtmlTemplate.find( '[data-uuid="' + pId + '"]' )[ 0 ].appendChild( ele );
  }

  $( '#' + id ).replaceWith( $( t.item.attr( 'data-moduletext' ).trim() ) );
  $( '.drop-helper' ).sortable( { opacity: .35, connectWith: '.drop-helper', handle: '.drag-helper' } );
}

function updateInnerTemplateFrame( e, t ) {
  var id = t.item.attr( 'data-uuid' );
  var ele = t.item.clone()[ 0 ];
  var pId = findParentDropHelper( t.item[ 0 ] );
  var pureHtmlTemplate = $( '#v-pureHtmlTemplate' ).contents();

  pureHtmlTemplate.find( '[data-uuid="' + id + '"]' ).remove();
  pureHtmlTemplate.find( '[data-uuid="' + pId + '"]' )[ 0 ].appendChild( ele );
}

function cleanTags( node ) {
  function getChildren( node ) {
    if ( node && node.nodeType === 1 ) {
      if ( node.className.includes( 'drag-helper' ) ) {
        node.parentNode.removeChild( node );
      }

      if ( node.className.includes( 'drag ui-draggable' ) ) {
        node.removeAttribute(  'data-modulejs' );
        node.removeAttribute(  'data-modulecs' );
        node.removeAttribute(  'data-moduletext' );
      }
    }

    var childNodes = node? node.childNodes: [];
    for( var i = 0, length = childNodes.length; i < length; i++ ) {
      getChildren( childNodes[ i ] );
    }
  }

  getChildren( node );
}

function directToTemplate( type ) {
  pageModelStoraged();
  type === 0? window.open( "../views/pagesTemplate.html" ): window.open( "../views/pagesMobile.html" );
}

function savePageModel() {
  var shareModal = $( '#v-shareModal' );
  var model = {
    pageId: pageModel.pageId,
    pageTypeId: pageModel.pageTypeId,
    pageName: pageModel.pageName,
    pageSortId: pageModel.pageSortId,
    pageText: collectHtml(),
    pagePureText: purifyLayout(),
    pageJs: collectJavascript( pageModel.pageId ),
    pageStyle: collectStylesheet( pageModel.pageId )
  };

  $.ajax( {
    url: path + version + '/api/pageModel/' + pageModel.pageId,
    type: 'put',
    dataType: 'json',
    data: model,
    success: function( data ) {
      if ( data.code == 204 ) {
        $( '.modal-body' ).html( '保存成功！' );
        shareModal.find( '.modal-header' ).html( '提示' );
        shareModal.find( '.modal-body' ).html( '保存成功！' );
        shareModal.modal( 'show' );
      } else {
        shareModal.find( '.modal-header' ).html( '提示' );
        shareModal.find( '.modal-body' ).html( '保存失败！' );
        shareModal.modal( 'show' );
      }
    },
    error: function() {
      shareModal.find( '.modal-header' ).html( '提示' );
      shareModal.find( '.modal-body' ).html( '保存失败！' );
      shareModal.modal( 'show' );
    },
  } );
}

function pageModelStoraged() {
  sessionStorage.setItem( 'pagePureText', purifyLayout() );
  sessionStorage.setItem( 'pageJs', collectJavascript() );
  sessionStorage.setItem( 'pageStyle', collectStylesheet() );
}
