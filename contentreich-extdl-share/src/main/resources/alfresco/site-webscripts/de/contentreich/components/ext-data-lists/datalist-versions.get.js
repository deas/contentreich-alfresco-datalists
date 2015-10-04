function main()
{
   // allow for content to be loaded from id
   if (args.nodeRef != null)
   {
      var nodeRef = args.nodeRef;
      
      // Call the repo to get the document versions
      var result = remote.call("/api/version?nodeRef=" + nodeRef);
      
      // Create javascript objects from the server response
      var versions = [];
      
      if (result.status == 200)
      {
         versions = eval('(' + result + ')');
      }
      
      // Prepare the model for the template
      model.nodeRef = nodeRef;
      model.filename = versions.length > 0 ? versions[0].name : null;
      model.versions = versions;      
   }
}

main();
