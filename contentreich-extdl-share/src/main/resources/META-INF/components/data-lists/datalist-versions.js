/**
 * Datalist Version component.
 *
 * @namespace Alfresco
 * @class Alfresco.DatalistVersions
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      Selector = YAHOO.util.Selector;

   /**
    * Dashboard DocumentVersions constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.DatalistVersions} The new component instance
    * @constructor
    */
   Alfresco.DatalistVersions = function DV_constructor(htmlId)
   {
      Alfresco.DatalistVersions.superclass.constructor.call(this, "Alfresco.DatalistVersions", htmlId, ["button", "container"]);

      return this;
   }

   YAHOO.extend(Alfresco.DatalistVersions, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type {object} object literal
       */
      options:
      {
         /**
          * An array with labels in the same order as they are listed in the html template
          *
          * @property versions
          * @type Array an array of object literals of the following form:
          * {
          *    label: {string}, // the version ot revert the node to
          *    createDate: {string}, // the date the version was creted in freemarker?datetime format
          * }
          */
         versions: []

      },

      /**
       * Fired by YUI when parent element is available for scripting
       * @method onReady
       */
      onReady: function DV_onReady()
      {
         // Listen on clicks for revert version icons
         var versions = this.options.versions, version, i, j, reverter;
         
         for (i = 0, j = versions.length; i < j; i++)
         {
        	 var displayOld = Dom.get(this.id + "-display-a-" + i);
             if (displayOld)
             {
                Event.addListener(displayOld, "click", function (event, obj)
                {
                   // Stop browser from using href attribute
                   Event.preventDefault(event);

                   // Find the index of the version link by looking at its id
                   version = versions[obj.versionIndex];
                   
                   
                   var templateUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT + "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}",
			         {
			            itemKind: "node",
			            itemId: version.nodeRef,
			            mode: "view"
			         });
		
			         // Using Forms Service, so always create new instance
			         var showVersion = new Alfresco.module.SimpleViewDialog(this.id +  "-showVersion-" + i);
			         showVersion.setOptions(
			         {
			            width: "60em",
			            templateUrl: templateUrl
			         }).show();
                },
                {
                   versionIndex: i
                }, this);
             }
        	
        	// Listen on clicks on the version - date row so we can expand and collapse it
            var expander = Dom.get(this.id + "-expand-a-" + i),
               moreVersionInfoDiv = Dom.get(this.id + "-moreVersionInfo-div-" + i);            

            if (expander)
            {               
               Event.addListener(expander, "click", function (event, obj)
               {
                  // Stop browser from using href attribute
                  Event.preventDefault(event)

                  if (obj.moreVersionInfoDiv && Dom.hasClass(obj.expandDiv, "collapsed"))
                  {
                     //Alfresco.util.Anim.fadeIn(obj.moreVersionInfoDiv);
                     Dom.setStyle(obj.moreVersionInfoDiv, "display", "block");
                     Dom.removeClass(obj.expandDiv, "collapsed");
                     Dom.addClass(obj.expandDiv, "expanded");
                  }
                  else
                  {
                     Dom.setStyle(obj.moreVersionInfoDiv, "display", "none");
                     Dom.removeClass(obj.expandDiv, "expanded");
                     Dom.addClass(obj.expandDiv, "collapsed");
                  }
               },
               {
                  expandDiv: expander,
                  moreVersionInfoDiv: moreVersionInfoDiv
               }, this);
            }

            // Format and display the createdDate
            Dom.get(this.id + "-createdDate-span-" + i).innerHTML = Alfresco.util.formatDate(versions[i].createdDate);
         }
      }

      
   });
})();
