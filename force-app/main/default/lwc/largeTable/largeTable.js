import { LightningElement, track, api } from 'lwc';
import getDataChunk from '@salesforce/apex/LargeDataController.getDataChunk';
import getTotalCount from '@salesforce/apex/LargeDataController.getTotalCount';
import LOADING_LABEL from '@salesforce/label/c.LargeTable_Loading';
import LOADING_COMPLETE_LABEL from '@salesforce/label/c.LargeTable_LoadingComplete';
import ERROR_LOADING_LABEL from '@salesforce/label/c.LargeTable_ErrorLoading';
import SEARCH_PLACEHOLDER_LABEL from '@salesforce/label/c.LargeTable_SearchPlaceholder';
import NO_DATA_LABEL from '@salesforce/label/c.LargeTable_NoData';
import NO_DATA_DESCRIPTION_LABEL from '@salesforce/label/c.LargeTable_NoDataDescription';
import FIRST_LABEL from '@salesforce/label/c.LargeTable_First';
import PREVIOUS_LABEL from '@salesforce/label/c.LargeTable_Previous';
import NEXT_LABEL from '@salesforce/label/c.LargeTable_Next';
import LAST_LABEL from '@salesforce/label/c.LargeTable_Last';

const PAGE_SIZE = 1000;
const CHUNK_SIZE = 1000;

export default class LargeTable extends LightningElement {

    @track data = [];
    @track filteredData = [];
    @track displayedData = [];
    @track columns = [
        { label: 'Name', fieldName: 'Name', sortable: true },
        { label: 'Email', fieldName: 'Email__c', sortable: true },
        { label: 'Latitude', fieldName: 'Location__Latitude__s', type: 'number', sortable: true },
        { label: 'Longitude', fieldName: 'Location__Longitude__s', type: 'number', sortable: true },
        { label: 'Some Value', fieldName: 'SomeValue__c', type: 'number', sortable: true }
    ];

    @track isLoading = true;
    @track loadingProgress = 0;
    @track errorMessage = '';
    @track searchTerm = '';
    @track sortField = 'Name';
    @track sortDirection = 'asc';
    @track currentPage = 1;
    @track totalPages = 1;
    @track totalRecords = 0;

    connectedCallback() {
        this.loadAllData();
    }

    async loadAllData() {
        this.isLoading = true;
        this.loadingProgress = 0;
        this.errorMessage = '';
        this.data = [];
        this.filteredData = [];
        this.displayedData = [];

        try {
            // First get total count
            this.totalRecords = await getTotalCount({ searchTerm: this.searchTerm });
            this.totalPages = Math.ceil(this.totalRecords / PAGE_SIZE);

            // Load data in chunks
            let lastId = null;
            let lastSortValue = null;
            let loadedRecords = 0;

            while (true) {
                const chunk = await getDataChunk({
                    lastId: lastId,
                    lastSortValue: lastSortValue,
                    sortField: this.sortField,
                    sortDirection: this.sortDirection,
                    searchTerm: this.searchTerm,
                    chunkSize: CHUNK_SIZE
                });

                if (chunk.length === 0) {
                    break; // No more data
                }

                // Add chunk to data array
                this.data = [...this.data, ...chunk];
                loadedRecords += chunk.length;

                // Update progress
                this.loadingProgress = Math.round((loadedRecords / this.totalRecords) * 100);

                // Set cursor for next chunk
                const lastRecord = chunk[chunk.length - 1];
                lastId = lastRecord.Id;
                lastSortValue = String(lastRecord[this.sortField] || '');

                // Prevent infinite loops
                if (loadedRecords >= this.totalRecords) {
                    break;
                }
            }

            this.applyFilteringAndSorting();
            this.updateDisplayedData();

        } catch (error) {
            this.errorMessage = 'Error loading data: ' + error.body?.message || error.message;
            console.error('Error loading data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    applyFilteringAndSorting() {
        let filtered = [...this.data];

        // Apply search filter if search term exists
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(record =>
                (record.Name && record.Name.toLowerCase().includes(term)) ||
                (record.Email__c && record.Email__c.toLowerCase().includes(term))
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aVal = a[this.sortField];
            let bVal = b[this.sortField];

            // Handle null values
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return this.sortDirection === 'asc' ? -1 : 1;
            if (bVal == null) return this.sortDirection === 'asc' ? 1 : -1;

            // Convert to appropriate type for comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // String comparison
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();

            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        this.filteredData = filtered;
        this.totalPages = Math.ceil(this.filteredData.length / PAGE_SIZE);
        this.currentPage = Math.min(this.currentPage, this.totalPages) || 1;
    }

    updateDisplayedData() {
        const startIndex = (this.currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        this.displayedData = this.filteredData.slice(startIndex, endIndex);
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.currentPage = 1;
        this.loadAllData();
    }

    handleSort(event) {
        const { fieldName: sortField, sortDirection } = event.detail;
        this.sortField = sortField;
        this.sortDirection = sortDirection;
        this.currentPage = 1;
        this.applyFilteringAndSorting();
        this.updateDisplayedData();
    }

    handleFirstPage() {
        this.currentPage = 1;
        this.updateDisplayedData();
    }

    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateDisplayedData();
        }
    }

    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updateDisplayedData();
        }
    }

    handleLastPage() {
        this.currentPage = this.totalPages;
        this.updateDisplayedData();
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage === this.totalPages;
    }

    get pageInfo() {
        return `Page ${this.currentPage} of ${this.totalPages}`;
    }

    get hasData() {
        return this.displayedData.length > 0;
    }
}
