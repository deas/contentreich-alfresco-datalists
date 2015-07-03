
/**
 * AttachmentControl component.
 * 
 * @namespace Alfresco
 * @class Alfresco.AttachmentControl
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
   	$hasEventInterest = Alfresco.util.hasEventInterest;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $hasEventInterest = Alfresco.util.hasEventInterest,
      $combine = Alfresco.util.combinePaths;
   /**
    * AttachmentControl constructor.
    * 
    * @param {String} htmlId The HTML id of the control element
    * @return {Alfresco.AttachmentControl} The new AttachmentControl instance
    * @constructor
    */
   Alfresco.AttachmentControlMod = function(htmlId)
   {
      Alfresco.AttachmentControlMod.superclass.constructor.call(this, "Alfresco.AttachmentControlMod", htmlId, ["button", "container", "cookie"]);
      this.fileUpload = null;
      
      return this;
   };
   
   YAHOO.extend(Alfresco.AttachmentControlMod, Alfresco.component.Base,
   {
	   /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         
         /**
          * current nodeRef
          * 
          * @property nodeRef
          * @type object
          */
         nodeRef: null,
         
         /**
          * object picker
          * @property picker
          * @type Alfresco.ObjectFinder
          */
          objectFinder: null,
          
          /** 
           * Turn of selection of location in repo/site
           * @property allowNavigation
           * @type boolean
           */
          allowNavigation: true,
          
          /**
           * Specifies the location the object finder should start, the following
           * values are supported:
           * 
           * - {companyhome}
           * - {userhome}
           * - {siteshome}
           * - {doclib}
           * - {self}
           * - {parent}
           * - A NodeRef
           * - An XPath
           * 
           * @property startLocation
           * @type string
           */
          startLocation: null,
          
          /**
           * Specifies the parameters to pass to the node locator service
           * when determining the start location node.
           * 
           * @property startLocationParams
           * @type string
           */
          startLocationParams: null,
          /**
           * The id of the item being edited
           * 
           * @property currentItem
           * @type string
           */
          currentItem: null,
          parentNodeRef: null
      },
 
      
      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function AttachmentControlMod_onReady()
      {

       if (this.options.objectFinder.widgets.addButton) {
    	  this.options.objectFinder.widgets.addButton.set("disabled", true);
//    	  this.options.objectFinder.widgets.addButton.hide();
    	  YAHOO.util.Dom.setStyle(this.options.objectFinder.widgets.addButton, 'display', 'none');
    	  this.widgets.uploadAttachment = Alfresco.util.createYUIButton(this, "button", this.onUploadAttachment,
    	  	         {
    	  	            disabled: false
    	  	         });
       }

      },

      /**
       * Upload Attachment button click handler
       *
       * @method onUploadAttachment
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
       onUploadAttachment: function AttachmentControlMod_onUploadAttachment(e, p_obj)
      {
    	   if (!this.widgets.destinationDialog)
           {
    	      this._locateStartingNode();

    	      YAHOO.Bubbling.on("refreshItemList", function (layer, args)
                      {
                         if ($hasEventInterest(this.options.objectFinder, args))
                         {
                             this.widgets.destinationDialog.setOptions(
                                     {
                                    	 pathNodeRef: {"uri": this.options.objectFinder.options.objectRenderer.options.parentNodeRef.replace("://","/")},
                                     });
                             if (this.options.allowNavigation) { //} && !this.options.objectRenderer.startLocationResolved) {
                          	   this.widgets.destinationDialog.showDialog();
                             } else {
                                 this.showFileUpload({
                                	 nodeRef: this.options.objectFinder.options.objectRenderer.options.parentNodeRef
                                 });
                             }
                         }
                      }, this);
              this.widgets.destinationDialog = new Alfresco.module.DoclibGlobalFolder(this.id + "-destinationDialog");
              this.widgets.destinationDialog.setOptions(
              {
                 title: this.msg("form.attachments.dialog.destination.title"),
                 siteId : Alfresco.constants.SITE,
                 containerId: "documentLibrary",
                 //or path
                 //pathNodeRef: {"uri": this.options.objectFinder.options.objectRenderer.options.parentNodeRef.replace("://","/")},
                 allowedViewModes:
                     [
                        Alfresco.module.DoclibGlobalFolder.VIEW_MODE_SITE
                     ]
              });

              YAHOO.Bubbling.on("folderSelected", function (layer, args)
              {
                 if ($hasEventInterest(this.widgets.destinationDialog, args))
                 {
                    var selectedFolder = args[1].selectedFolder;
                    if (selectedFolder !== null)
                    {
                       this.showFileUpload(selectedFolder);
                       
                    }
                 }
              }, this);
           }
           this.widgets.destinationDialog.setOptions(
           {
             //
           });
           //
           
           if (this.options.allowNavigation) { // && this.options.objectFinder.options.objectRenderer.startLocationResolved
        	   this.widgets.destinationDialog.showDialog();
           } else if (this.options.objectFinder.options.objectRenderer.startLocationResolved) {
               this.showFileUpload({
              	 nodeRef: this.options.objectFinder.options.objectRenderer.options.parentNodeRef
               });
           }
      },
      
      showFileUpload: function AttachmentControlMod_showFileUpload(selectedFolder) {
    	  if (this.fileUpload === null)
          {
             this.fileUpload = Alfresco.getFileUploadInstance(); 
          }
          
          // Show uploader for multiple files
          var multiUploadConfig =
          {
             filter: [],
             mode: this.fileUpload.MODE_MULTI_UPLOAD,
             thumbnails: "doclib",
             onFileUploadComplete:
             {
                fn: this.onFileUploadComplete,
                scope: this
             }
          };
          
          if (selectedFolder.nodeRef) {
        	  // from nodelocator resolve
        	  multiUploadConfig.destination = selectedFolder.nodeRef; 
          } else {
        	  //from object-finder
            siteId: selectedFolder.siteId;
            containerId: selectedFolder.containerId;
            uploadDirectory: selectedFolder.path;
          }
          this.fileUpload.show(multiUploadConfig);  
      },
      /**
       * File Upload complete event handler
       *
       * @method onFileUploadComplete
       * @param complete {object} Object literal containing details of successful and failed uploads
       */
      onFileUploadComplete: function AttachmentControlMod_onFileUploadComplete(complete)
      {
         var success = complete.successful.length, file;
         if (success > 0)
         {
           for (var i = 0; i < success; i++)
           {
              file = complete.successful[i];
              file.name = file.fileName;
              YAHOO.Bubbling.fire("selectedItemAdded",
              {
                 eventGroup: this.options.objectFinder,
                 item : file
              });
           }
           YAHOO.Bubbling.fire("renderCurrentValue",
	         {
	            eventGroup: this.options.objectFinder
	         });
         }
      },
      _locateStartingNode: function AttachmentsMod__locateStartingNode()
      {
    	  this.options.objectFinder._locateStartingNode();
    	  this.options.objectFinder.options.rootNode=this.options.objectFinder.options.objectRenderer.options.parentNodeRef;
      },
   });
})();