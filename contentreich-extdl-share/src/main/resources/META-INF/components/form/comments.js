/**
 * Alfresco.CommentsControls component.
 * 
 * Displays a list of comments.
 * 
 * @namespace Alfresco
 * @class Alfresco.CommentsControls
 */
(function()
{
    
   /**
   * YUI Library aliases
   */
   var Dom = YAHOO.util.Dom;

   /**
    * CommentList constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.CommentsControls} The new Comment instance
    * @constructor
    */
   Alfresco.CommentsControls = function(htmlId)
   {
      Alfresco.CommentsControls.superclass.constructor.call(this, "Alfresco.CommentsControls", htmlId, ["editor", "paginator"]);
      
      /* Initialise prototype properties */
      this.editData = 
      {
         viewDiv: null,
         row: -1,
         data: null,
         widgets: {}
      };

      return this;
   };
   
   YAHOO.extend(Alfresco.CommentsControls, Alfresco.component.Base,
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
          * Node reference of the item to comment about
          */
         itemNodeRef: null,
         
         /**
          * Number of items per page
          *
          * @property pageSize
          * @type int
          */
         pageSize: 5
      },
      
      
      /**
       * Comments data
       */
      commentsData: null,
      
      /**
       * Tells whether an action is currently ongoing.
       * 
       * @property busy
       * @type boolean
       * @see _setBusy/_releaseBusy
       */
      busy: null,

      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function CommentList_onReady()
      { 
         var me = this;
         // YUI Paginator definition
         var paginator = new YAHOO.widget.Paginator(
         {
            containers: [this.id + "-paginator"],
            rowsPerPage: this.options.pageSize,
            initialPage: 1,
            template: this.msg("pagination.template"),
            pageReportTemplate: this.msg("pagination.template.page-report"),
            previousPageLinkLabel : this.msg("pagination.previousPageLinkLabel"),
            nextPageLinkLabel     : this.msg("pagination.nextPageLinkLabel")
         });
         paginator.subscribe('changeRequest', this.onPaginatorChange, this, true);
         paginator.set('recordOffset', 0);
         paginator.set('totalRecords', 0);
         paginator.render();
         this.widgets.paginator = paginator;

         this._loadCommentsList(0);
      },      

      /**
       * Called by the paginator when a user has clicked on next or prev.
       * Dispatches a call to the server and reloads the comment list.
       *
       * @method onPaginatorChange
       * @param state {object} An object describing the required page changing
       */
      onPaginatorChange : function CommentList_onPaginatorChange(state)
      {
         this._loadCommentsList(state.recordOffset);
      },
    
      /**
       * Loads the comments for the provided nodeRef and refreshes the ui
       */
      _loadCommentsList: function CommentList__loadCommentsList(startIndex)
      {
         // construct the url to call
         var url = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT + "components/node/{nodeRef}/comments",
         {
            nodeRef: this.options.itemNodeRef.replace(":/", "")
         });

         // execute ajax request
         Alfresco.util.Ajax.request(
         {
            url: url,
            dataObj:
            {
               startIndex: startIndex,
               pageSize: this.options.pageSize
            },
            successCallback:
            {
               fn: this.loadCommentsSuccess,
               scope: this
            },
            failureMessage: this.msg("message.loadComments.failure")
         });
         
      },

      /**
       * Load comments ajax request success handler.
       */
      loadCommentsSuccess: function CommentsList_loadCommentsSuccess(response)
      {
          
         var comments = response.json.items;

         // Get the elements to update
         var bodyDiv = Dom.get(this.id),
            commentDiv = Dom.get(this.id + "-comments");
         
         // temporarily hide the container node
         bodyDiv.setAttribute("style", "display:none");

         
         // Update the list elements
         var html = '', i, j;
         for (i = 0, j = comments.length; i < j; i++)
         {
            html += this.renderComment(i, comments[i]);
         }
         commentDiv.innerHTML = html;
         bodyDiv.removeAttribute("style");
         
         // keep a reference to the loaded data
         this.commentsData = comments;
         
         this._updatePaginator(response.json.startIndex, response.json.total);
      },

      /**
       * Called by loadCommentsSuccess when it has rendered the comments.
       * Since this componenent listens for the event "setCommentedNode" that can be displayed
       * before this component has created its own widgets and paginator it must wait until the paginator
       * has been created and then update it.
       *
       * @method updatePaginator
       * @param page {int} The page of comments in the paging list that is displayed
       * @param total {int} The totla number of comments in the paging
       */
      _updatePaginator: function CommentList__updatePaginator(page, total)
      {
         if (this.widgets && this.widgets.paginator)
         {
            this.widgets.paginator.set('recordOffset', page);
            this.widgets.paginator.set('totalRecords', total);
         }
         else
         {
            YAHOO.lang.later(100, this, this._updatePaginator, [page, total]);
         }
      },

      /**
       * Renders a comment element.
       * Each comment element consists of an edit and a view div.
       */
      renderComment: function CommentList_renderComment(index, data)
      {
         // add a div for the comment edit form
         var html = '';
         html += '<div id="' + this.id + '-comment-edit-' + index + '" class="hidden"></div>';
         
         // output the view
         var rowClass = index % 2 === 0 ? "even" : "odd";
         html += '<div class="comment ' + rowClass + '" id="' + this.id + '-comment-view-' + index + '">';
         html += this.renderCommentView(index, data);
         html += '</div>';
         
         return html;
      },
      
      /**
       * Renders the content of the comment view div.
       */
      renderCommentView: function CommentList_renderCommentView(index, data)
      {
         var html = '';
         
         // comment info and content
         html += '<div class="nodeContent"><div class="userLink">' + Alfresco.util.people.generateUserLink(data.author);
         html += ' ('+Alfresco.util.formatDate(data.createdOn)+'):';
         html += '</div>';
         html += '<div class="content yuieditor">' + data.content + '</div>';
         html += '</div>';

         return html;
      }
   });
})();
