module.exports = {

    /** 
     * Mongo result to string summarizer.
     * @param BulkWriteResult
     */
    getResultSummary: function(res) {
        return `ok: ${res.ok}, nInserted: ${res.nInserted}, nUpdated: ${res.nUpdated}, nUpserted: ${res.nUpserted}, nModified: ${res.nModified}, nRemoved: ${res.nRemoved}`;
    }
};
