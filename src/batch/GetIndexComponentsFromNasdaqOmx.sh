### This scripts curls html from nasdaq omx home page and lets node parse index components from it.

#!/bin/bash

DEBUG=$1

function updateIndex() {
    NAME=$1
    INDEXSYMBOLS=$2
    DATA=$3

    if [ -n "$DEBUG" ]; then
        echo "name: $NAME"
        echo "indexsymbols: $INDEXSYMBOLS"
        echo "data: $DATA"
    fi

    node src/batch/CreateIndexFromNasdaqOmxIndexHtml.js "$NAME" "$INDEXSYMBOLS" "$DATA"
}

# Stockholm large cap
# Curl copied from http://www.nasdaqomxnordic.com/index/index_info?Instrument=SE0001775784
updateIndex OMXSLCPI ^OMXSPI "$(curl 'http://www.nasdaqomxnordic.com/webproxy/DataFeedProxy.aspx' -H 'Pragma: no-cache' -H 'Origin: http://www.nasdaqomxnordic.com' -H 'Accept-Encoding: gzip, deflate' -H 'Accept-Language: en-US,en;q=0.8,sv;q=0.6' -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Accept: text/html, */*; q=0.01' -H 'Cache-Control: no-cache' -H 'X-Requested-With: XMLHttpRequest' -H 'Cookie: NSC_MC_Obtebrpnyopsejd_IUUQ=ffffffff09be0e1e45525d5f4f58455e445a4a423660; ASP.NET_SessionId=yev3uyzvvkay2c2gh4kugo45; pcoq_hits=11; nasdaqomxnordic_sharesform=radio%3DnordicShares%26market%3D0%26balticMarket%3D0%26segment%3D0%26fnSegment%3D0; s_cc=true; s_sq=%5B%5BB%5D%5D; JSESSIONID=B47841D5EEAC2B1D1544601CA8764395; __utmt=1; __utma=77775883.155340273.1450905845.1475586234.1475603831.20; __utmb=77775883.1.10.1475603831; __utmc=77775883; __utmz=77775883.1464727930.4.2.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided)' -H 'Connection: keep-alive' -H 'Referer: http://www.nasdaqomxnordic.com/index/index_info?Instrument=SE0001775784' --data 'xmlquery=%3Cpost%3E%0A%3Cparam+name%3D%22Exchange%22+value%3D%22NMF%22%2F%3E%0A%3Cparam+name%3D%22SubSystem%22+value%3D%22Prices%22%2F%3E%0A%3Cparam+name%3D%22Action%22+value%3D%22GetIndexInstruments%22%2F%3E%0A%3Cparam+name%3D%22inst__a%22+value%3D%220%2C1%2C2%2C5%2C37%2C4%2C20%2C21%2C23%2C24%2C33%2C34%2C97%2C129%2C98%2C10%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt%22+value%3D%22%2FnordicV3%2Finst_table.xsl%22%2F%3E%0A%3Cparam+name%3D%22Instrument%22+value%3D%22SE0001775784%22%2F%3E%0A%3Cparam+name%3D%22XPath%22+value%3D%22%2F%2Findex%2F%2Finstruments%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt_lang%22+value%3D%22en%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt_tableId%22+value%3D%22sharesInIndexTable%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt_hiddenattrs%22+value%3D%22%2Clists%2Ctp%2Chlp%2Cisin%2Cnote%2C%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt_notlabel%22+value%3D%22nm%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt_options%22+value%3D%22%2Cnoflag%2Csectoridicon%2C%22%2F%3E%0A%3Cparam+name%3D%22app%22+value%3D%22%2Findex%2Findex_info%22%2F%3E%0A%3C%2Fpost%3E' --compressed)"

# OMXS30
updateIndex OMXS30 ^OMXSPI "$(curl 'http://www.nasdaqomxnordic.com/webproxy/DataFeedProxy.aspx' -H 'Pragma: no-cache' -H 'Origin: http://www.nasdaqomxnordic.com' -H 'Accept-Encoding: gzip, deflate' -H 'Accept-Language: en-US,en;q=0.8,sv;q=0.6' -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Accept: text/html, */*; q=0.01' -H 'Cache-Control: no-cache' -H 'X-Requested-With: XMLHttpRequest' -H 'Cookie: NSC_MC_Obtebrpnyopsejd_IUUQ=ffffffff09be0e1e45525d5f4f58455e445a4a423660; ASP.NET_SessionId=yev3uyzvvkay2c2gh4kugo45; pcoq_hits=11; nasdaqomxnordic_sharesform=radio%3DnordicShares%26market%3D0%26balticMarket%3D0%26segment%3D0%26fnSegment%3D0; JSESSIONID=6A4CD20E2350A2F62575FC1FAF1A8C58; __utmt=1; s_cc=true; s_sq=%5B%5BB%5D%5D; __utma=77775883.155340273.1450905845.1475603831.1475611338.21; __utmb=77775883.2.10.1475611338; __utmc=77775883; __utmz=77775883.1464727930.4.2.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided)' -H 'Connection: keep-alive' -H 'Referer: http://www.nasdaqomxnordic.com/index/index_info?Instrument=SE0000337842' --data 'xmlquery=%3Cpost%3E%0A%3Cparam+name%3D%22Exchange%22+value%3D%22NMF%22%2F%3E%0A%3Cparam+name%3D%22SubSystem%22+value%3D%22Prices%22%2F%3E%0A%3Cparam+name%3D%22Action%22+value%3D%22GetIndexInstruments%22%2F%3E%0A%3Cparam+name%3D%22inst__a%22+value%3D%220%2C1%2C2%2C5%2C37%2C4%2C20%2C21%2C23%2C24%2C33%2C34%2C97%2C129%2C98%2C10%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt%22+value%3D%22%2FnordicV3%2Finst_table.xsl%22%2F%3E%0A%3Cparam+name%3D%22Instrument%22+value%3D%22SE0000337842%22%2F%3E%0A%3Cparam+name%3D%22XPath%22+value%3D%22%2F%2Findex%2F%2Finstruments%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt_lang%22+value%3D%22en%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt_tableId%22+value%3D%22sharesInIndexTable%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt_hiddenattrs%22+value%3D%22%2Clists%2Ctp%2Chlp%2Cisin%2Cnote%2C%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt_notlabel%22+value%3D%22nm%22%2F%3E%0A%3Cparam+name%3D%22ext_xslt_options%22+value%3D%22%2Cnoflag%2Csectoridicon%2C%22%2F%3E%0A%3Cparam+name%3D%22app%22+value%3D%22%2Findex%2Findex_info%22%2F%3E%0A%3C%2Fpost%3E' --compressed)"
