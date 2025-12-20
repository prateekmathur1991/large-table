/**
 * Controller class for Large Data Table Lightning Web Component
 * Provides data access methods with proper security and error handling
 */
public with sharing class LargeDataController {

    /**
     * Retrieves a chunk of Large Data Store records using cursor-based pagination
     * @param lastId The Id of the last record from previous chunk (null for first chunk)
     * @param lastSortValue The sort field value of the last record from previous chunk
     * @param sortField The field to sort by
     * @param sortDirection The sort direction (ASC or DESC)
     * @param searchTerm The search term to filter records
     * @param chunkSize The number of records to retrieve
     * @return List of record data as Maps for LWC consumption
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getDataChunk(
        String lastId,
        String lastSortValue,
        String sortField,
        String sortDirection,
        String searchTerm,
        Integer chunkSize
    ) {
        try {
            // Sanitize inputs to prevent injection
            lastId = String.isBlank(lastId) ? null : String.escapeSingleQuotes(lastId);
            lastSortValue = String.isBlank(lastSortValue) ? null : String.escapeSingleQuotes(lastSortValue);
            sortField = String.isBlank(sortField) ? null : String.escapeSingleQuotes(sortField);
            sortDirection = String.isBlank(sortDirection) ? null : String.escapeSingleQuotes(sortDirection);
            searchTerm = String.isBlank(searchTerm) ? null : String.escapeSingleQuotes(searchTerm);

            // Call service layer
            List<Large_Data_Store__c> records = LargeDataService.getDataChunk(
                lastId, lastSortValue, sortField, sortDirection, searchTerm, chunkSize
            );

            // Convert to Map format for LWC
            List<Map<String, Object>> result = new List<Map<String, Object>>();
            for (Large_Data_Store__c record : records) {
                Map<String, Object> recordMap = new Map<String, Object>();
                recordMap.put('Id', record.Id);
                recordMap.put('Name', record.Name);
                recordMap.put('Email__c', record.Email__c);
                recordMap.put('Location__Latitude__s', record.Location__Latitude__s);
                recordMap.put('Location__Longitude__s', record.Location__Longitude__s);
                recordMap.put('Location__c', record.Location__c);
                recordMap.put('SomeValue__c', record.SomeValue__c);
                result.add(recordMap);
            }

            return result;

        } catch (Exception e) {
            throw new AuraHandledException('Error fetching data chunk: ' + e.getMessage());
        }
    }

    /**
     * Gets the total count of records matching search criteria
     * @param searchTerm The search term to filter records
     * @return Total count of matching records
     */
    @AuraEnabled(cacheable=true)
    public static Integer getTotalCount(String searchTerm) {
        try {
            // Sanitize input
            searchTerm = String.isBlank(searchTerm) ? null : String.escapeSingleQuotes(searchTerm);

            // Call service layer
            return LargeDataService.getTotalCount(searchTerm);

        } catch (Exception e) {
            throw new AuraHandledException('Error getting total count: ' + e.getMessage());
        }
    }
}
