public class LargeDataController {
    
    @AuraEnabled(cacheable=true)
    public static List<Object> getLargeDataSet() {
        
        String sessionId = UserInfo.getSessionId();

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

        return records;
    }
}