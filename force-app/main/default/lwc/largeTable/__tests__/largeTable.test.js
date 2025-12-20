import { createElement } from '@lwc/engine-dom';
import LargeTable from 'c/largeTable';

// Mock the Apex methods
jest.mock(
    '@salesforce/apex/LargeDataController.getDataChunk',
    () => {
        return {
            default: jest.fn()
        };
    },
    { virtual: true }
);

jest.mock(
    '@salesforce/apex/LargeDataController.getTotalCount',
    () => {
        return {
            default: jest.fn()
        };
    },
    { virtual: true }
);

// Import the mocked modules
import getDataChunk from '@salesforce/apex/LargeDataController.getDataChunk';
import getTotalCount from '@salesforce/apex/LargeDataController.getTotalCount';

// Mock custom labels
jest.mock(
    '@salesforce/label/c.LargeTable_Loading',
    () => ({ default: 'Loading data...' }),
    { virtual: true }
);
jest.mock(
    '@salesforce/label/c.LargeTable_LoadingComplete',
    () => ({ default: 'Loading complete' }),
    { virtual: true }
);
jest.mock(
    '@salesforce/label/c.LargeTable_ErrorLoading',
    () => ({ default: 'Error loading data' }),
    { virtual: true }
);
jest.mock(
    '@salesforce/label/c.LargeTable_SearchPlaceholder',
    () => ({ default: 'Search by name or email...' }),
    { virtual: true }
);
jest.mock(
    '@salesforce/label/c.LargeTable_NoData',
    () => ({ default: 'No data found' }),
    { virtual: true }
);
jest.mock(
    '@salesforce/label/c.LargeTable_NoDataDescription',
    () => ({ default: 'Try adjusting your search criteria.' }),
    { virtual: true }
);
jest.mock(
    '@salesforce/label/c.LargeTable_First',
    () => ({ default: 'First' }),
    { virtual: true }
);
jest.mock(
    '@salesforce/label/c.LargeTable_Previous',
    () => ({ default: 'Previous' }),
    { virtual: true }
);
jest.mock(
    '@salesforce/label/c.LargeTable_Next',
    () => ({ default: 'Next' }),
    { virtual: true }
);
jest.mock(
    '@salesforce/label/c.LargeTable_Last',
    () => ({ default: 'Last' }),
    { virtual: true }
);

describe('c-large-table', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('should render loading state initially', () => {
        // Mock the Apex calls to return promises that don't resolve immediately
        getTotalCount.mockReturnValue(new Promise(() => {}));
        getDataChunk.mockReturnValue(new Promise(() => {}));

        // Arrange
        const element = createElement('c-large-table', {
            is: LargeTable
        });

        // Act
        document.body.appendChild(element);

        // Assert
        return Promise.resolve().then(() => {
            const spinner = element.shadowRoot.querySelector('lightning-spinner');
            expect(spinner).toBeTruthy();
            expect(element.isLoading).toBe(true);
        });
    });

    it('should load and display data successfully', () => {
        const mockData = [
            { Id: '1', Name: 'Test Record 1', Email__c: 'test1@example.com', SomeValue__c: 100 },
            { Id: '2', Name: 'Test Record 2', Email__c: 'test2@example.com', SomeValue__c: 200 }
        ];

        getTotalCount.mockResolvedValue(2);
        getDataChunk.mockResolvedValue(mockData);

        // Arrange
        const element = createElement('c-large-table', {
            is: LargeTable
        });

        // Act
        document.body.appendChild(element);

        // Assert
        return Promise.resolve().then(() => {
            // Wait for the component to finish loading
            return new Promise(resolve => setTimeout(resolve, 100));
        }).then(() => {
            expect(element.isLoading).toBe(false);
            expect(element.data).toEqual(mockData);
            expect(element.displayedData.length).toBe(2);

            const datatable = element.shadowRoot.querySelector('lightning-datatable');
            expect(datatable).toBeTruthy();
            expect(datatable.data).toEqual(mockData);
        });
    });

    it('should handle search functionality', () => {
        const mockData = [
            { Id: '1', Name: 'John Doe', Email__c: 'john@example.com', SomeValue__c: 100 },
            { Id: '2', Name: 'Jane Smith', Email__c: 'jane@example.com', SomeValue__c: 200 }
        ];

        getTotalCount.mockResolvedValue(2);
        getDataChunk.mockResolvedValue(mockData);

        // Arrange
        const element = createElement('c-large-table', {
            is: LargeTable
        });
        document.body.appendChild(element);

        // Wait for initial load
        return Promise.resolve().then(() => {
            return new Promise(resolve => setTimeout(resolve, 100));
        }).then(() => {
            // Act - perform search
            const searchInput = element.shadowRoot.querySelector('lightning-input');
            searchInput.value = 'John';
            searchInput.dispatchEvent(new CustomEvent('change', { detail: { value: 'John' } }));

            // Assert
            return Promise.resolve().then(() => {
                expect(getTotalCount).toHaveBeenCalledWith({ searchTerm: 'John' });
                expect(getDataChunk).toHaveBeenCalledWith({
                    lastId: null,
                    lastSortValue: null,
                    sortField: 'Name',
                    sortDirection: 'asc',
                    searchTerm: 'John',
                    chunkSize: 1000
                });
            });
        });
    });

    it('should handle sorting', () => {
        const mockData = [
            { Id: '1', Name: 'Test Record 1', Email__c: 'test1@example.com', SomeValue__c: 100 },
            { Id: '2', Name: 'Test Record 2', Email__c: 'test2@example.com', SomeValue__c: 200 }
        ];

        getTotalCount.mockResolvedValue(2);
        getDataChunk.mockResolvedValue(mockData);

        // Arrange
        const element = createElement('c-large-table', {
            is: LargeTable
        });
        document.body.appendChild(element);

        // Wait for initial load
        return Promise.resolve().then(() => {
            return new Promise(resolve => setTimeout(resolve, 100));
        }).then(() => {
            // Act - trigger sort
            const datatable = element.shadowRoot.querySelector('lightning-datatable');
            datatable.dispatchEvent(new CustomEvent('sort', {
                detail: { fieldName: 'Email__c', sortDirection: 'desc' }
            }));

            // Assert
            expect(element.sortField).toBe('Email__c');
            expect(element.sortDirection).toBe('desc');
        });
    });

    it('should handle pagination', () => {
        // Create mock data for 3 pages (3000 records, 1000 per page)
        const mockData = Array.from({ length: 3000 }, (_, i) => ({
            Id: String(i + 1),
            Name: `Record ${i + 1}`,
            Email__c: `email${i + 1}@example.com`,
            SomeValue__c: i + 1
        }));

        getTotalCount.mockResolvedValue(3000);
        getDataChunk.mockResolvedValue(mockData.slice(0, 1000));

        // Arrange
        const element = createElement('c-large-table', {
            is: LargeTable
        });
        document.body.appendChild(element);

        // Wait for initial load
        return Promise.resolve().then(() => {
            return new Promise(resolve => setTimeout(resolve, 100));
        }).then(() => {
            // Initially on page 1
            expect(element.currentPage).toBe(1);
            expect(element.displayedData.length).toBe(1000);

            // Act - go to next page
            const nextButton = element.shadowRoot.querySelectorAll('lightning-button')[2]; // Next button
            nextButton.click();

            // Assert
            expect(element.currentPage).toBe(2);

            // Act - go to last page
            const lastButton = element.shadowRoot.querySelectorAll('lightning-button')[3]; // Last button
            lastButton.click();

            // Assert
            expect(element.currentPage).toBe(3);
        });
    });

    it('should handle errors gracefully', () => {
        getTotalCount.mockRejectedValue(new Error('Test error'));
        getDataChunk.mockRejectedValue(new Error('Test error'));

        // Arrange
        const element = createElement('c-large-table', {
            is: LargeTable
        });

        // Act
        document.body.appendChild(element);

        // Assert
        return Promise.resolve().then(() => {
            return new Promise(resolve => setTimeout(resolve, 100));
        }).then(() => {
            expect(element.isLoading).toBe(false);
            expect(element.errorMessage).toContain('Error loading data');
        });
    });

    it('should display no data message when no records found', () => {
        getTotalCount.mockResolvedValue(0);
        getDataChunk.mockResolvedValue([]);

        // Arrange
        const element = createElement('c-large-table', {
            is: LargeTable
        });

        // Act
        document.body.appendChild(element);

        // Assert
        return Promise.resolve().then(() => {
            return new Promise(resolve => setTimeout(resolve, 100));
        }).then(() => {
            const noDataMessage = element.shadowRoot.querySelector('.slds-text-align_center');
            expect(noDataMessage).toBeTruthy();
            expect(element.hasData).toBe(false);
        });
    });
});
