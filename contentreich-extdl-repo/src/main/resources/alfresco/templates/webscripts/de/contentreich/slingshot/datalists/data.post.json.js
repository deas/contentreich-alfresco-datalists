<import resource="classpath:alfresco/templates/webscripts/org/alfresco/slingshot/datalists/evaluator.lib.js">
<import resource="classpath:alfresco/templates/webscripts/de/contentreich/slingshot/datalists/extdl-filters.lib.js">
<import resource="classpath:alfresco/templates/webscripts/de/contentreich/slingshot/datalists/parse-args.lib.js">

const REQUEST_MAX = 2000;
const allFilterUseSearch = true; //this works faster for larger lists

/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */


// var ESCAPES = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"], [/"/g, "&quot;"]]

function escape(value) {
	return value.replace('"','');
	/*
	var escaped = value;
	for(var item in ESCAPES)
	    escaped = escaped.replace(ESCAPES[item][0], ESCAPES[item][1]);
	return escaped;
	*/
}

//function filterRange(array, range) {
//	logger.log("Applying " + range.prop + " range filter " + range.min + " <= x <= " + range.max);
//	var filtered = [];
//	for (var i=0; i<array.length; i++) {
//		obj = array[i];
//		logger.log(obj.properties[range.prop]);
//		var minOk = !range.min || (obj.properties[range.prop] && (range.min.getTime() <= obj.properties[range.prop].getTime()));
//		var maxOk = !range.max || (obj.properties[range.prop] && (obj.properties[range.prop].getTime() <= range.max.getTime()));
//		if (minOk && maxOk) {
//			filtered.push(obj);
//		}
//	}
//	
//	return filtered;
//}

//function xPathFilterQuery(filterData) {
//	var rangeFilters = [];
//	var fieldQuery = [];
//	var fieldNamesIterator = filterData.getFieldNames().iterator();
//	for ( ; fieldNamesIterator.hasNext(); ){
//		var fieldName = fieldNamesIterator.next();
//		if (filterData.getFieldData(fieldName).getValue()!= ""){
//			var propName = fieldName.replace("prop_","").replace("_",":");
//	    	var value = new String(filterData.getFieldData(fieldName).getValue());
//	    	if (propName.indexOf("-date-range") > 0){
//	    		propName = propName.replace("-date-range","");
//	    		rf = { prop: propName };
//				var dates = value.split("TO");
//				if (dates[0] == ""){
//					rf.max =  utils.fromISO8601(dates[1]);
//				}
//				else if (dates[1] == ""){
//					rf.min = utils.fromISO8601(dates[0]);
//				}else{
//					rf.min =  utils.fromISO8601(dates[0]);
//					rf.max = utils.fromISO8601(dates[1]);
//				}
//	    		rangeFilters.push(rf);
//	    	}
//	    	else if (propName.indexOf("Priority") > 0 || propName.indexOf("Status") > 0){
//				var values = value.split(",");
//				var escaped = [];
//				for (var i=0;i<values.length;i++) {
//					escaped.push('"' + escape(values[i]) + '"');
//				}
//				fieldQuery.push('(@' + propName + '=' + escaped.join(' or @' + propName + '=') + ')');
//	    	} 
//	    	else{
//	    		fieldQuery.push("(like(@" + propName + ',"*' + escape(value) + '*"))');
//	    	}
//	    	
//		}
//	}
//	return {
//		rangeFilters : rangeFilters,
//		propQuery : "[" + fieldQuery.join(" and ") + "]" 
//	}
//}

/**
 * Main entry point: Return data list with properties being supplied in POSTed arguments
 *
 * @method getData
 */
function getData()
{
   // Use helper function to get the arguments
   var parsedArgs = ParseArgs.getParsedArgs();
   if (parsedArgs === null)
   {
      return;
   }

   var fields = null;
   // Extract fields (if given)
   if (json.has("fields"))
   {
      // Convert the JSONArray object into a native JavaScript array
      fields = [];
      var jsonFields = json.get("fields"),
         numFields = jsonFields.length();
      
      for (count = 0; count < numFields; count++)
      {
         fields.push(jsonFields.get(count).replaceFirst("_", ":"));
      }
   }

   // Try to find a filter query based on the passed-in arguments
   var filter = parsedArgs.filter,
      allNodes = [], node,
      items = [],
      totalItems;
   
   var 	skip = 0,
   		size = 100,
   		total = 0,
   		page = 1,
   		countTotal;
   
   
   if (json.has("size"))
   {
	   size = json.get("size");
	   
      if (json.has("page"))
      {
    	  page = json.get("page");
          skip = (page - 1) * size;
      }
   }
   
   requestTotalCountMax = skip + REQUEST_MAX;
   
   if (json.has("total"))
   {
	   total = json.get("total");
	  
	   if (0 < total  && total < REQUEST_MAX) {
		   requestTotalCountMax = total + 10; // add for growth
	   } // else we do not know use absolute max: requestTotalCountMax
   }
   var sortAsc = true;
   var sortField = "cm:name";

   if (json.has("filter")) {
	   var filterJson = json.get("filter");
	  
	   if (filterJson.has("sortField")) {
		  var sortField = filterJson.get("sortField").replace("assoc_","").replace("prop_","").replace("_",":");
	   } 
	   if (filterJson.has("sortAsc")) {
		  var sortAsc = filterJson.get("sortAsc");
	   } 
   }
  
   var parentNode = parsedArgs.listNode;

   if (!allFilterUseSearch && (parentNode != null) && (filter == null || filter.filterId == "" || filter.filterId == "all"))
   {
	  // Use non-query method
//      if (parentNode != null)
//      {

         var pagedResult = parentNode.childFileFolders(true, false, Filters.IGNORED_TYPES, skip, size, requestTotalCountMax, sortField, sortAsc, null);
         allNodes = pagedResult.page;
         totalItems = pagedResult.totalResultCountUpper;
//      }
   }
   else    
   {

	 /* this creates a bug for the items filters in the datalist.
	  * 
	  // XPath for solr systems
	  var n = search.findNode(parsedArgs.nodeRef);
	  var q = xPathFilterQuery(filter.filterData);
	  // logger.log(parsedArgs.nodeRef + " -> *" + q.propQuery);
	  var res = n.childrenByXPath("* " + q.propQuery);
	  logger.log("Got " + res.length + " results, " + q.rangeFilters.length + " range filters");
	  for (var i=0; i<q.rangeFilters.length; i++) {
		  res = filterRange(res, q.rangeFilters[i]);
	  }
	  allNodes = res;
	  */
	  
      var filterParams = Filters.getFilterParams(filter, parsedArgs);
      var query = filterParams.query;
      // Query the nodes - passing in default sort and result limit parameters
      if (query !== "")
      {
    	  var sortObj = [{
    		                     column: "@" + sortField,
    		                     ascending: sortAsc
    		                  }];
//this is just cm:name sorting - var sortObj = filterParams.sort;
    	  
    	  var queryObj = {
    	            query: query,
    	            language: filterParams.language,
    	 /* we need to get all and slice, no paging results, doh! */
    				page:
    				{
    					skipCount: skip,
    					pageSize: size, 
    					maxItems: requestTotalCountMax
    				},
    	            
    	/*if you get exception on custom text property sorting, you need indexing in your model set to
    	 * <index enabled="true">
    	      <atomic>false</atomic>
    	      <stored>false</stored> 
    	      <tokenised>both</tokenised>
    	   </index>
    	   
    	   for numerical properties you need
    	     <index enabled="true">
    	      <atomic>false</atomic>
    	      <stored>false</stored> 
    	      <tokenised>true</tokenised>
    	   </index>
    	  */
    	            sort: sortObj,
    	            templates: filterParams.templates,
    	            namespace: (filterParams.namespace ? filterParams.namespace : null)
    	         };

         allNodes = search.query(queryObj);
      }
      if (pagedResult) {
	      allNodes = pagedResult.page;
	      totalItems = pagedResult.totalResultCountUpper;
		  //allNodes = allNodes.slice(0, size);
      }
      else 
	  {
    	  totalItems = skip + allNodes.length;
		  allNodes = allNodes.slice(0, size);
	  }
   }
   
   var paging = {
		   totalRecords: totalItems,
		   startIndex: skip };

   if (paging.totalRecords == (skip + REQUEST_MAX)) {
	   paging.totalRecordsUpper = true;
   }
   
   if (allNodes.length > 0)
   {
      for each (node in allNodes)
      {
         try
         {
             items.push(Evaluator.run(node, fields));
         }
         catch(e) {}
      }
   }

   return (
   {
      fields: fields,
      paging: paging,
      parent:
      {
         node: parsedArgs.listNode,
         userAccess:
         {
            create: parsedArgs.listNode.hasPermission("CreateChildren")
         }
      },
      items: items
   });
}

model.data = getData();