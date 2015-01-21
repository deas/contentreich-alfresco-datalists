/*
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
package de.fme.alfresco.repo.jscript;

import java.io.Serializable;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import org.alfresco.error.AlfrescoRuntimeException;
import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.repo.jscript.ScriptPagingNodes;
import org.alfresco.repo.jscript.Search;
import org.alfresco.repo.jscript.ValueConverter;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.cmr.search.LimitBy;
import org.alfresco.service.cmr.search.ResultSet;
import org.alfresco.service.cmr.search.ResultSetRow;
import org.alfresco.service.cmr.search.SearchParameters;
import org.alfresco.service.cmr.search.SearchService;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.Context;

/**
 * Paged Search component for use by the ScriptService. Better paging version of Search.java/search in javascript
 * <p>
 * Provides access to Lucene search facilities including saved search objects. The results
 * from a search are returned as an array (collection) of scriptable Node wrapper objects.
 * <p>
 * The object is added to the root of the model to provide syntax such as:
 * <code>var results = search.luceneSearch(statement);</code>
 * and
 * <code>var results = search.savedSearch(node);</code>
 * 
 * @author Rasmus Melgaard, Novem-IT
 */
public class PagedSearch extends Search
{
    private static Log logger = LogFactory.getLog(PagedSearch.class);
    
    
    /**
     * Execute a query based on the supplied search definition object.
     * 
     * Search object is defined in JavaScript thus:
     * <pre>
     * search
     * {
     *    query: string,          mandatory, in appropriate format and encoded for the given language
     *    store: string,          optional, defaults to 'workspace://SpacesStore'
     *    language: string,       optional, one of: lucene, xpath, jcr-xpath, fts-alfresco - defaults to 'lucene'
     *    templates: [],          optional, Array of query language template objects (see below) - if supported by the language 
     *    sort: [],               optional, Array of sort column objects (see below) - if supported by the language
     *    page: object,           optional, paging information object (see below) - if supported by the language
     *    namespace: string,      optional, the default namespace for properties
     *    defaultField: string,   optional, the default field for query elements when not explicit in the query
     *    onerror: string         optional, result on error - one of: exception, no-results - defaults to 'exception'
     * }
     * 
     * sort
     * {
     *    column: string,         mandatory, sort column in appropriate format for the language
     *    ascending: boolean      optional, defaults to false
     * }
     * 
     * page
     * {
     *    maxItems: int,          optional, max number of items to return in result set
     *    pageSize: int,		  optional, max number of items to return in result set
     *    skipCount: int          optional, number of items to skip over before returning results
     * }
     * 
     * template
     * {
     *    field: string,          mandatory, custom field name for the template
     *    template: string        mandatory, query template replacement for the template
     * }
     * 
     * Note that only some query languages support custom query templates, such as 'fts-alfresco'. 
     * See the following documentation for more details:
     * {@link http://wiki.alfresco.com/wiki/Full_Text_Search_Query_Syntax#Templates}
     * </pre>
     * 
     * @param search    Search definition object as above
     * 
     * @return Array of ScriptNode results
     */
    public ScriptPagingNodes pagedQuery(Object search)
    {
    	ScriptPagingNodes results = null;
        
        if (search instanceof Serializable)
        {
            Serializable obj = new ValueConverter().convertValueForRepo((Serializable)search);
            if (obj instanceof Map)
            {
                Map<Serializable, Serializable> def = (Map<Serializable, Serializable>)obj;
                
                // test for mandatory values
                String query = (String)def.get("query");
                if (query == null || query.length() == 0)
                {
                    throw new AlfrescoRuntimeException("Failed to search: Missing mandatory 'query' value.");
                }
                
                // collect optional values
                String store = (String)def.get("store");
                String language = (String)def.get("language");
                List<Map<Serializable, Serializable>> sort = (List<Map<Serializable, Serializable>>)def.get("sort");
                Map<Serializable, Serializable> page = (Map<Serializable, Serializable>)def.get("page");
                String namespace = (String)def.get("namespace");
                String onerror = (String)def.get("onerror");
                String defaultField = (String)def.get("defaultField");
                
                // extract supplied values
                
                // sorting columns
                SortColumn[] sortColumns = null;
                if (sort != null)
                {
                    sortColumns = new SortColumn[sort.size()];
                    int index = 0;
                    for (Map<Serializable, Serializable> column : sort)
                    {
                        String strCol = (String)column.get("column");
                        if (strCol == null || strCol.length() == 0)
                        {
                            throw new AlfrescoRuntimeException("Failed to search: Missing mandatory 'sort: column' value.");
                        }
                        Boolean boolAsc = (Boolean)column.get("ascending");
                        boolean ascending = (boolAsc != null ? boolAsc.booleanValue() : false);
                        sortColumns[index++] = new SortColumn(strCol, ascending);
                    }
                }
                
                // paging settings
                int maxResults = -1;
                int skipResults = 0;
                int pageSizes = -1;
                if (page != null)
                {
                    if (page.get("maxItems") != null)
                    {
                        Object maxItems = page.get("maxItems");
                        if (maxItems instanceof Number)
                        {
                            maxResults = ((Number)maxItems).intValue();
                        }
                        else if (maxItems instanceof String)
                        {
                            // try and convert to int (which it what it should be!)
                            maxResults = Integer.parseInt((String)maxItems);
                        }
                    }
                    if (page.get("skipCount") != null)
                    {
                        Object skipCount = page.get("skipCount");
                        if (skipCount instanceof Number)
                        {
                            skipResults = ((Number)page.get("skipCount")).intValue();
                        }
                        else if (skipCount instanceof String)
                        {
                            skipResults = Integer.parseInt((String)skipCount);
                        }
                    }
                    if (page.get("pageSize") != null)
                    {
                        Object pageSize = page.get("pageSize");
                        if (pageSize instanceof Number)
                        {
                        	pageSizes = ((Number)page.get("pageSize")).intValue();
                        }
                        else if (pageSize instanceof String)
                        {
                        	pageSizes = Integer.parseInt((String)pageSize);
                        }
                    }
                }
                
                // query templates
                Map<String, String> queryTemplates = null;
                List<Map<Serializable, Serializable>> templates = (List<Map<Serializable, Serializable>>)def.get("templates");
                if (templates != null)
                {
                    queryTemplates = new HashMap<String, String>(templates.size(), 1.0f);
                    
                    for (Map<Serializable, Serializable> template : templates)
                    {
                        String field = (String)template.get("field");
                        if (field == null || field.length() == 0)
                        {
                            throw new AlfrescoRuntimeException("Failed to search: Missing mandatory 'template: field' value.");
                        }
                        String t = (String)template.get("template");
                        if (t == null || t.length() == 0)
                        {
                            throw new AlfrescoRuntimeException("Failed to search: Missing mandatory 'template: template' value.");
                        }
                        queryTemplates.put(field, t);
                    }
                }
                
                SearchParameters sp = new SearchParameters();
                sp.addStore(store != null ? new StoreRef(store) : this.storeRef);
                sp.setLanguage(language != null ? language : SearchService.LANGUAGE_LUCENE);
                sp.setQuery(query);
                if (defaultField != null)
                {
                    sp.setDefaultFieldName(defaultField);
                }
                if (namespace != null)
                {
                    sp.setNamespace(namespace);
                }
                if (maxResults > 0)
                {
                    sp.setLimit(maxResults);
                    sp.setLimitBy(LimitBy.FINAL_SIZE);
                }
                if (skipResults > 0)
                {
                    sp.setSkipCount(skipResults);
                }
                if (sort != null)
                {
                    for (SortColumn sd : sortColumns)
                    {
                        sp.addSort(sd.column, sd.asc);
                    }
                }
                if (queryTemplates != null)
                {
                    for (String field: queryTemplates.keySet())
                    {
                        sp.addQueryTemplate(field, queryTemplates.get(field));
                    }
                }
                
                // error handling opions
                boolean exceptionOnError = true;
                if (onerror != null)
                {
                    if (onerror.equals("exception"))
                    {
                        // default value, do nothing
                    }
                    else if (onerror.equals("no-results"))
                    {
                        exceptionOnError = false;
                    }
                    else
                    {
                        throw new AlfrescoRuntimeException("Failed to search: Unknown value supplied for 'onerror': " + onerror);
                    }
                }
                
                // execute search based on search definition
                results = pagedQuery(sp, pageSizes, exceptionOnError);
            }
        }
        
        if (results == null)
        {
            results = new ScriptPagingNodes(Context.getCurrentContext().newArray(getScope(), new Object[0]), false, 0, 0);
        }
        
        return results;
    }
    



    
    /**
     * Execute the query
     * 
     * Removes any duplicates that may be present (ID search can cause duplicates -
     * it is better to remove them here)
     * 
     * @param store         StoreRef to search against - null for default configured store
     * @param search        Lucene search to execute
     * @param sort          Columns to sort by
     * @param language      Search language to use e.g. SearchService.LANGUAGE_LUCENE
     * @param maxResults    Maximum results to return if > 0
     * @param skipResults   Results to skip in the result set
     * 
     * @return Array of Node objects
     */
    protected ScriptPagingNodes pagedQuery(String store, String search, SortColumn[] sort, String language, int maxResults, int skipResults, int pageSize)
    {   
        SearchParameters sp = new SearchParameters();
        sp.addStore(store != null ? new StoreRef(store) : this.storeRef);
        sp.setLanguage(language != null ? language : SearchService.LANGUAGE_LUCENE);
        sp.setQuery(search);
        if (maxResults > 0)
        {
            sp.setLimit(maxResults);
            sp.setLimitBy(LimitBy.FINAL_SIZE);
        }
        if (skipResults > 0)
        {
            sp.setSkipCount(skipResults);
        }
        if (sort != null)
        {
            for (SortColumn sd : sort)
            {
                sp.addSort(sd.column, sd.asc);
            }
        }
        
        return pagedQuery(sp, pageSize, true);
    }
    
    /**
     * Execute the query
     * 
     * Removes any duplicates that may be present (ID search can cause duplicates -
     * it is better to remove them here)
     * 
     * @param sp                SearchParameters describing the search to execute.
     * @param exceptionOnError  True to throw a runtime exception on error, false to return empty resultset
     * 
     * @return Array of Node objects
     */
    protected ScriptPagingNodes pagedQuery(SearchParameters sp, int pageSize, boolean exceptionOnError)
    {   
        Collection<ScriptNode> set = null;
        
        if (logger.isDebugEnabled())
           logger.debug("query=" + sp.getQuery() + " limit=" + (sp.getLimitBy() != LimitBy.UNLIMITED ? sp.getLimit() : "none"));
        int length = 0;
        // perform the search against the repo
        ResultSet results = null;
        try
        {
            results = this.services.getSearchService().query(sp);
            
            if (results.length() != 0)
            {
            	length = results.length();
                NodeService nodeService = this.services.getNodeService();
                int page = 0 < pageSize ? pageSize : results.length();
                set = new LinkedHashSet<ScriptNode>(page, 1.0f);
                for (ResultSetRow row: results)
                {
                    NodeRef nodeRef = row.getNodeRef();
                    if (nodeService.exists(nodeRef))
                    {
                       set.add(new ScriptNode(nodeRef, this.services, getScope()));
                       page--;
                       if (1 > page) {
                    	   break;
                       }
                    }
                }
            }
        }
        catch (Throwable err)
        {
            if (exceptionOnError)
            {
                throw new AlfrescoRuntimeException("Failed to execute search: " + sp.getQuery(), err);
            }
            else if (logger.isDebugEnabled())
            {
                logger.debug("Failed to execute search: " + sp.getQuery(), err);
            }
        }
        finally
        {
            if (results != null)
            {
                results.close();
            }
        }
        if (null == set) {
        	 return new ScriptPagingNodes(Context.getCurrentContext().newArray(getScope(), new Object[0]), Boolean.FALSE, 0, 0);
        } else {
        	int fullLength = length + sp.getSkipCount();
        	 return new ScriptPagingNodes(Context.getCurrentContext().newArray(getScope(), set.toArray(new Object[(set.size())])), 
             		length > set.size(), fullLength, fullLength);
        }
       
    }
    
    
}
