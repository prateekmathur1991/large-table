/**
 * Service class for Large Data Store operations
 * Handles data retrieval with cursor-based pagination, sorting, and searching
 */
public with sharing class LargeDataService {

    /**
     * Retrieves a chunk of Large_Data_Store__c records using cursor-based pagination
     * @param lastId The Id of the last record from previous chunk (null for first chunk)
     * @param lastSortValue The sort field value of the last record from previous chunk
     * @param sortField The field to sort by
     * @param sortDirection The sort direction (ASC or DESC)
     * @param searchTerm The search term to filter records (searches Name and Email__c)
     * @param chunkSize The number of records to retrieve (default 1000)
     * @return List of Large_Data_Store__c records
     */
    public static List<Large_Data_Store__c> getDataChunk(
        String lastId,
        String lastSortValue,
        String sortField,
        String sortDirection,
        String searchTerm,
        Integer chunkSize
    ) {
        // Default chunk size
        if (chunkSize == null || chunkSize <= 0) {
            chunkSize = 1000;
        }

        // Sanitize inputs
        sortField = String.isBlank(sortField) ? 'Name' : sortField;
        sortDirection = String.isBlank(sortDirection) ? 'ASC' : sortDirection.toUpperCase();

        // Validate sort field to prevent SOQL injection
        Set<String> allowedSortFields = new Set<String>{
            'Name', 'Email__c', 'Location__Latitude__s', 'Location__Longitude__s', 'SomeValue__c'
        };
        if (!allowedSortFields.contains(sortField)) {
            sortField = 'Name';
        }

        // Validate sort direction
        if (!sortDirection.equals('ASC') && !sortDirection.equals('DESC')) {
            sortDirection = 'ASC';
        }

        // Sanitize search term
        searchTerm = String.isBlank(searchTerm) ? '' : String.escapeSingleQuotes(searchTerm.trim());

        // Build the query
        String query = 'SELECT Id, Name, Email__c, Location__Latitude__s, Location__Longitude__s, Location__c, SomeValue__c ' +
                      'FROM Large_Data_Store__c';

        List<String> whereConditions = new List<String>();

        // Add search conditions if search term provided
        if (!String.isBlank(searchTerm)) {
            whereConditions.add('(Name LIKE \'%' + searchTerm + '%\' OR Email__c LIKE \'%' + searchTerm + '%\')');
        }

        // Add cursor-based pagination conditions if not first chunk
        if (!String.isBlank(lastId) && !String.isBlank(lastSortValue)) {
            // Sanitize lastSortValue
            lastSortValue = String.escapeSingleQuotes(lastSortValue);

            // For cursor pagination, we need to handle different field types
            if (sortField.equals('SomeValue__c') || sortField.equals('Location__Latitude__s') || sortField.equals('Location__Longitude__s')) {
                // Numeric fields - compare as decimals
                try {
                    Decimal lastValue = Decimal.valueOf(lastSortValue);
                    if (sortDirection.equals('ASC')) {
                        whereConditions.add('((' + sortField + ' > ' + lastValue + ') OR (' + sortField + ' = ' + lastValue + ' AND Id > \'' + lastId + '\'))');
                    } else {
                        whereConditions.add('((' + sortField + ' < ' + lastValue + ') OR (' + sortField + ' = ' + lastValue + ' AND Id < \'' + lastId + '\'))');
                    }
                } catch (Exception e) {
                    // If conversion fails, skip cursor condition
                }
            } else {
                // String fields
                if (sortDirection.equals('ASC')) {
                    whereConditions.add('((' + sortField + ' > \'' + lastSortValue + '\') OR (' + sortField + ' = \'' + lastSortValue + '\' AND Id > \'' + lastId + '\'))');
                } else {
                    whereConditions.add('((' + sortField + ' < \'' + lastSortValue + '\') OR (' + sortField + ' = \'' + lastSortValue + '\' AND Id < \'' + lastId + '\'))');
                }
            }
        }

        // Add WHERE clause if conditions exist
        if (!whereConditions.isEmpty()) {
            query += ' WHERE ' + String.join(whereConditions, ' AND ');
        }

        // Add ORDER BY
        query += ' ORDER BY ' + sortField + ' ' + sortDirection + ', Id ' + sortDirection;

        // Add LIMIT
        query += ' LIMIT ' + chunkSize;

        // Execute query with security enforced
        List<Large_Data_Store__c> records = Database.query(query);

        return records;
    }

    /**
     * Gets the total count of records matching search criteria
     * @param searchTerm The search term to filter records
     * @return Total count of matching records
     */
    public static Integer getTotalCount(String searchTerm) {
        // Sanitize search term
        searchTerm = String.isBlank(searchTerm) ? '' : String.escapeSingleQuotes(searchTerm.trim());

        String countQuery = 'SELECT COUNT() FROM Large_Data_Store__c';

        if (!String.isBlank(searchTerm)) {
            countQuery += ' WHERE Name LIKE \'%' + searchTerm + '%\' OR Email__c LIKE \'%' + searchTerm + '%\'';
        }

        return Database.countQuery(countQuery);
    }
}
