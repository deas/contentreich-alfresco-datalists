/**
 * Document Library "FolderSize" module for Document Library.
 * 
 * @namespace Alfresco.module
 * @class Alfresco.module.FolderSize
 */
(function()
{
   /**
   * YUI Library aliases
   */
   var Dom = YAHOO.util.Dom;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML;

   /*
   if (typeof Contentreich == "undefined" || !Contentreich)
   {
      var Contentreich = {};
   }
   Contentreich.module = Contentreich.module || {};
   */


   Alfresco.module.FolderSize = function(htmlId)
   {
      Alfresco.module.FolderSize.superclass.constructor.call(this, "Alfresco.module.FolderSize", htmlId, ["button", "container", "connection", "json"]);
      
      // Initialise prototype properties
      return this;
   };
   
   YAHOO.extend(Alfresco.module.FolderSize, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       */
      options:
      {
          // containerId: null,
          // path: this.currentPath,
          files: null,
          maxdepth: 2
      },
      /*
      center : null,

      */

      /**
       * Container element for template in DOM.
       * 
       * @property containerDiv
       * @type DOMElement
       */
      containerDiv: null,

      /**
       * Main entry point
       * @method showDialog
       */
      showDialog: function DLP_showDialog()
      {
         // DocLib Actions module
         if (!this.modules.actions)
         {
            this.modules.actions = new Alfresco.module.DoclibActions();
         }
         
         if (!this.containerDiv)
         {
            // Load the UI template from the server
            Alfresco.util.Ajax.request(
            {
               url: Alfresco.constants.URL_SERVICECONTEXT + "modules/documentlibrary/folder-size",
               dataObj:
               {
                  htmlid: this.id,
                  site: this.options.siteId
               },
               successCallback:
               {
                  fn: this.onTemplateLoaded,
                  scope: this
               },
               failureMessage: "Could not load template",
               execScripts: true
            });
         }
         else
         {
            // Show the dialog
            this._showDialog();
         }
      },

      /**
       * Event callback when dialog template has been loaded
       *
       * @method onTemplateLoaded
       * @param response {object} Server response from load template XHR request
       */
      onTemplateLoaded: function DLP_onTemplateLoaded(response)
      {
         // Inject the template from the XHR request into a new DIV element
         this.containerDiv = document.createElement("div");
         this.containerDiv.setAttribute("style", "display:none");
         this.containerDiv.innerHTML = response.serverResponse.responseText;

         // The panel is created from the HTML returned in the XHR request, not the container
         var dialogDiv = Dom.getFirstChild(this.containerDiv);
         while (dialogDiv && dialogDiv.tagName.toLowerCase() != "div")
         {
            dialogDiv = Dom.getNextSibling(dialogDiv);
         }
         
         // Create and render the YUI dialog
         this.widgets.dialog = Alfresco.util.createYUIPanel(dialogDiv,
         {
            width: this.options.width
         });
         
         this.widgets.okButton = Alfresco.util.createYUIButton(this, "ok", this.onOK);
         // Show the dialog
         this._showDialog();
      },


      /**
       * YUI WIDGET EVENT HANDLERS
       * Handlers for standard events fired from YUI widgets, e.g. "click"
       */

      /**
       * Dialog OK button event handler
       *
       * @method onOK
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onOK: function DLP_onOK(e, p_obj)
      {
     	 this._hideDialog();
      },
      
      /**
       * PRIVATE FUNCTIONS
       */
      // // http://localhost:8080/alfresco/s/slingshot/doclib/node/workspace/SpacesStore/b130e8a2-c968-4278-9491-cc0192bd3c30
      _initNode : function DLP__initNode(node, childLinkId, depth) {
    	  node.linkId = childLinkId;
    	  node.depth = depth;
    	  if (node.children && node.children.length > 0)  {
    		  for (var i=0; i< node.children.length ; i++) {
    			  var cid = null;
    			  if (!childLinkId && depth == 2) {
    				  cid = node.id;
    			  }  else {
    				  cid = childLinkId;
    			  }
    			  this._initNode(node.children[i], cid, depth + 1);
    		  }
    	  }
      },
      
      _setNode : function DLP__setNode(node) {
    	  this.options.files = node;
      },
      
      _setNodeRef : function DLP__setNode(nodeRef) {
          Alfresco.util.Ajax.jsonGet({
         	 url : Alfresco.constants.PROXY_URI + "slingshot/doclib/node/" + new Alfresco.util.NodeRef(nodeRef).uri,
         	 failureMessage : this.msg("message.failure"),
         	 successCallback: {
         		 fn: function (response) { this._setNode(response.json); },
         		 scope: this
         	 }
          });
      },
      
      /**
       * Internal show dialog function
       * @method _showDialog
       */
      _showDialog: function DLP__showDialog()
      {
        // Enable buttons
    	// this.options.files
    	
        this.widgets.okButton.set("disabled", false);

     	// http://mbostock.github.com/d3/ex/treemap.js
     	var width = 960,
     	    height = 500;
     	    // color = function() { return "#E3EBEC" }; // Hack ! // d3.scale.category20c();

     	Dom.get(this.id  + "-header").innerHTML = "<h2>" + this.msg("header.folder-size", this.options.files.fileName) + "</h2>";    
     	var treemap = d3.layout.treemap()
     	    .size([width, height])
     	    .sticky(true)
     	    .value(function(d) { return d.folderSum + d.contentSum; });
     	d3.select("#" + this.id + "-treemap").html("");
     	var div = d3.select("#" + this.id + "-treemap").append("div")
     		.style("position", "relative")
     		.style("width", width + "px")
     		.style("height", height + "px");
     	var me = this;
     	d3.json(Alfresco.constants.PROXY_URI + "contentreich/info/size-treemap/" + this.options.files.nodeRef.replace(/.*\//,"") + "?maxdepth=" + this.options.maxdepth , function(json) {
     	  me._initNode(json, null, 1);
     	  // json is null for error
     	  div.data([json]).selectAll("div")
     	      .data(treemap.nodes)
     	    .enter().append("div")
     	      .attr("class", "treemap-cell yui-picker-panel")
     	      // .style("background", function(d) { return (d.children && d.children.length > 0) ? color(d.name) : null; })
     	      .call(cell)
     	      .text(function(d) { return (d.children && d.children.length > 0) ? null : d.name + " (" + YAHOO.util.Number.format((d.folderSum + d.contentSum)/(1024*1024) , { decimalPlaces: 2 }) + " MB)"; });
     	  /*
     	  d3.select("#size").on("click", function() {
     	    div.selectAll("div")
     	        .data(treemap.value(function(d) { return d.size; }))
     	      .transition()
     	        .duration(1500)
     	        .call(cell);

     	    d3.select("#size").classed("active", true);
     	    d3.select("#count").classed("active", false);
     	  });

     	  d3.select("#count").on("click", function() {
     	    div.selectAll("div")
     	        .data(treemap.value(function(d) { return 1; }))
     	      .transition()
     	        .duration(1500)
     	        .call(cell);

     	    d3.select("#size").classed("active", false);
     	    d3.select("#count").classed("active", true);
     	  });
     	  */
     	});
     	function cell() {
     	  this
     	      .style("left", function(d) { return d.x + "px"; })
     	      .style("top", function(d) { return d.y + "px"; })
     	      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
     	      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; })
     	      .on("click", function(d,i) { if (d.linkId) alert(d.linkId); });
     	   }
           // Register the ESC key to close the dialog
           var escapeListener = new YAHOO.util.KeyListener(document,
           {
              keys: YAHOO.util.KeyListener.KEY.ESCAPE
           },
           {
              fn: function(id, keyEvent)
              {
            	  this._hideDialog();
              },
              scope: this,
              correctScope: true
           });
           escapeListener.enable();

           // Show the dialog
           this.widgets.dialog.show();
      },

      /**
       * Hide the dialog, removing the caret-fix patch
       *
       * @method _hideDialog
       * @private
       */
      _hideDialog: function DLP__hideDialog()
      {
         this.widgets.okButton.set("disabled", true);

         // Grab the form element
         var formElement = Dom.get(this.id + "-form");

         // Undo Firefox caret issue
         Alfresco.util.undoCaretFix(formElement);
         this.widgets.dialog.hide();
      }
   });

   /* Dummy instance to load optional YUI components early */
   var dummyInstance = new Alfresco.module.FolderSize("null");
})();