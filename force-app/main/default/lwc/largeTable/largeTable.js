import { LightningElement, wire } from 'lwc';
import  getLargeData from '@salesforce/apex/LargeDataController.getLargeDataSet';

export default class LargeTable extends LightningElement {

    data = [];
    columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Email', fieldName: 'Email__c' },
        { label: 'Latitude', fieldName: 'Location__Latitude__s', type: 'number' },
        { label: 'Longitude', fieldName: 'Location__Longitude__s', type: 'number' },
        { label: 'Some Value', fieldName: 'SomeValue__c' }
    ];
    showLoadingSpinner = true;
    
    fetchOptions = {
        queryLocator: null
    }

    @wire(getLargeData, { fetchOptions: '$fetchOptions' })
    loadData({error, data}) {
        if (data) {
            this.data = data;
            this.showLoadingSpinner = false;
        } else if (error) {
            console.error('Error fetching data:', error);
        }
    }
}