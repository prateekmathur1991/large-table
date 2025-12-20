### Salesforce Development Work

1. You need to build a lightning web component that can display data from a Salesforce custom object that has 70,000 records.
2. The lightning web component should support sorting by any column, searching through the data, navigating between pages, and also jumping on the first or the last page of results.
3. The table should display only 1000 records at a given time.
4. The solution must not block the user interface and should allow seamless sorting and searching through results.

### Technical Context for the work

1. You must use a lightning-datatable for display the results.
2. The Salesforce platform places a maximum limit of 2000 on the OFFSET keyword. So your solution cannot depend on the OFFSET keyword.