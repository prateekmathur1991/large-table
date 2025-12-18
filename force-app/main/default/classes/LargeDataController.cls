public class LargeDataController {
    
    @AuraEnabled(cacheable=true)
    public static ResponseWrapper getLargeDataSet(FetchOptions fetchOptions) {
        
        // The sessionId from UserInfo.getSessionId() will not be API enabled, so we get a API enabled sessionId from Visualforce Page context.
        String sessionId = Page.Sessionid.getContent().toString().substringBetween('SESSION_ID_START', 'SESSION_ID_END');

        String orgBaseUrl = URL.getOrgDomainURL().toExternalForm();
        String path = '/services/data/v65.0/query/?q=' + EncodingUtil.urlEncode('SELECT Name, Email__c, Location__Latitude__s, Location__Longitude__s, Location__c, SomeValue__c FROM Large_Data_Store__c', 'UTF-8');

        HttpRequest req = new HttpRequest();
        req.setEndpoint(orgBaseUrl + path);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + sessionId);
        req.setHeader('Content-Type', 'application/json');
        Http http = new Http();

        HttpResponse res = http.send(req);

        if (res.getStatusCode() != 200) {
            throw new AuraHandledException('Error fetching data: ' + res.getBody());
        }

        Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        List<Object> records = (List<Object>) responseMap.get('records');

        ResponseWrapper responseWrapper = new ResponseWrapper();
        responseWrapper.records = records;
        responseWrapper.nextRecordsUrl = (String) responseMap.get('nextRecordsUrl');

        return responseWrapper;
    }

    private class FetchOptions {

        @AuraEnabled
        public String queryLocator { get; set; }
    }

    private class ResponseWrapper {
        
        @AuraEnabled
        public List<Object> records { get; set; }

        @AuraEnabled
        public String nextRecordsUrl { get; set; }
    }
}