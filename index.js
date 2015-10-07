var fs              = require('fs');
var URI             = require('crawler-ninja/lib/uri');
var logs            = require("crawler-ninja-logger");
var domainChecker   = require("check-domain");


var ERROR_DNS_LOOKUP = "ENOTFOUND";
var STATUS_DNS_LOOKUP_ERROR = "DNS lookup failed";
var EXPIRED_TXT_FILE = process.cwd() + "/expireds.txt";
var crawlLog = logs.Logger;

var expiredTxtFile = EXPIRED_TXT_FILE;
/**
 *  Find expired domains
 *
 *  In progress ... please wait
 */
function Plugin(params) {

    var logFile = "./logs/expireds.log";
    if (params && params.logFile) {
      logFile = params.logFile;
    }
    this.expiredLog = logs.createLogger("expireds", {"path" : logFile});

    if (params && params.expiredTxtFile) {
      expiredTxtFile = params.expiredTxtFile;
    }
}

Plugin.prototype.crawl = function (result,$, callback) {

      // a page with a status of 500+ can be expired
      if (result.statusCode >= 500 && result.statusCode <= 599 ) {
        crawlLog.info({"url" : result.uri, "step" : "expired-domains-plugin", "message" : "Crawl status 500 "});
        this.expiredLog.info({"50*" : true, status : result.statusCode, url : result.url});
        check(URI.domain(result.uri), callback);

      }
      callback();
}

Plugin.prototype.error = function(error, result, callback) {

        crawlLog.info({"url" : result.uri, "step" : "expired-domains-plugin", "message" : "error" });
        if (error.code == ERROR_DNS_LOOKUP) {
          var domain = URI.domain(result.uri);
          this.expiredLog.info({expired : true, domain : domain, url : result.url});
          check(URI.domain(result.uri), callback);
        }
        else {
          // Just to be sure, catch other errors
          this.expiredLog.info({error : true, code : error.code, url : result.url});
          callback();
        }

}


check = function(domain, callback) {
    crawlLog.info({"url" : domain, "step" : "expired-domains-plugin", "message" : "check"});
    domainChecker({domain : domain}, function(error, result) {

        if (error) {
          return callback(error);
        }

        var line = result.domain + "," + (result.pr ? result.pr : "no-pr") + "," + result.available + "," + (result.whois.toString() ?  result.whois.toString(): "no-whois") + "\n";
        fs.appendFile(expiredTxtFile, line);
        callback();
    });
}

module.exports.Plugin = Plugin;
