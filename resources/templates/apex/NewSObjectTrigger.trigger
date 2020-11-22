trigger {{triggerName}} on {{sObjectType}} ({{events}}) {
    for ({{sObjectType}} item : Trigger.New) {
        final Map<String, {{sObjectType}}> eventData = new Map<String, {{sObjectType}}>();
        eventData.put('New', item);
        String content = {{webhookClass}}.jsonContent(eventData);
        {{webhookClass}}.callout('${endpointUrl}', content);
    }
}
