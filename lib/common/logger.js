var _=require('lodash');
var util=require('util');
var moment=require('moment');
var Promise=require('bluebird');
var fs=require('fs');
var sliceFn=Array.prototype.slice;
var LEVEL={
        'DEBUG':1,
        'INFO':2,
        'WARN':3,
        'ERROR':4
};

var LogWriter=function(type){
    var config=LoggerFactory.configs[type];
    var messages=[];
    var count=0;//文件名称计数
    var fileWriter=false;
    var filePath=false;//当前日志文件路径
    var isCreatingFileWriter=false;//如果正在创建，则filePath,fileWriter必为空
    var isOKToWrite=true;//输出流是否现在可写入

    var getLogFilePath=function(){
        count++;
        var dateInfo='';
        if(config.LOG_FILE_DATE_PATTERN){
            dateInfo='-'+moment().format(config.LOG_FILE_DATE_PATTERN);
        }
        var path=config.LOG_FILE+dateInfo+'-'+count+'.log';

        return new Promise(function(resolve){
            //如果使用fs.existsAsync()，如果文件已存在则会报错，所以下面使用了
            if(!fs.existsSync(path))return resolve(path);
            fs.stat(path,function(err,stats){
                if(config.MAX_FILE_SIZE*1024>stats.size)return resolve(path);
                resolve(getLogFilePath());
            });
        });
    };

    var flushLogs=function(){
        if(isCreatingFileWriter||messages.length==0)return;
        fileWriter.write(messages.join());
        messages=[];
    };

    var createFileWriter=function(){
        if(!config.WRITE_TO_FILE)return;
        if(isCreatingFileWriter)return;
        isCreatingFileWriter=true;

        var oldWriter=fileWriter;
        fileWriter=false;
        filePath=false;

        getLogFilePath().then(function(path){
            var writer=fs.createWriteStream(path,
                {flags: 'a',encoding: 'utf-8',mode: 0666});

            //需要在文件打开后写入日志，如果文件不存在，会自动创建
            writer.once('open',function(fd){
                fileWriter=writer;
                filePath=path;
                isCreatingFileWriter=false;
                isOKToWrite=true;
                flushLogs();
                if(oldWriter)oldWriter.end();
            });

            //如果写入出错，直接抛出错误
            writer.once('error',function(err){
                console.error(err,'写入日志信息时发生错误');
                throw err;
            });
        });
    };

    var resetFileWriter=function(){
        if(!config.WRITE_TO_FILE)return;
        if(isCreatingFileWriter)return nextCheck();

        fs.stat(filePath,function(err,stats){
            if(stats.size>config.MAX_FILE_SIZE*1024)createFileWriter();
            nextCheck()
        });

        function nextCheck(){
            setTimeout(resetFileWriter,config.FILE_SIZE_CHECK_INTERVAL*1000);
        }
    };

    var s={};
    s.write=function(message,level){
        if(config.WRITE_TO_CONSOLE){
            var fn=(LEVEL[level]>=LEVEL.WARN)?console.warn:console.log;
            fn.call(console,message);
        }

        if(!config.WRITE_TO_FILE)return;
        message+='\n';
        if(isCreatingFileWriter||!isOKToWrite)
            return messages.push(message); //如果fileWriter还未创建或不可写入，则先放入缓存

        //如果连续大量写入，write()将返回false，后续写入数据将保存到内存等待写入
        //此时则需等到writer触发drain事件后再写入
        isOKToWrite=fileWriter.write(message);
        if(!isOKToWrite)fileWriter.once('drain',function(){
            isOKToWrite=true;
            flushLogs();
        });
    }

    createFileWriter();
    resetFileWriter();

    return s;
};

var Logger=function(tag,type){
    var config=LoggerFactory.configs[type];
    var writer=LoggerFactory.getLogWriter(type);
    var isInTagFilter=!config.TAG_FILTER||config.TAG_FILTER.length==0||
        _.some(config.TAG_FILTER,function(filter){return tag==filter;});


    var formatLog=function(level,errCode,err,message,params){
        var dateMess=moment().format('YYYY-MM-DD HH:mm:ss sss');

        message=message||'';
        params=params||[];
        params.unshift(message);
        message=util.format.apply(util,params);

        var errMess=err?util.format('\n%s\n%s\n',err.name,err.stack):'';
        var logMess=util.format('[%s][%s][%s][%d][%s][%s]',dateMess,level,tag,errCode,message,errMess);

        return logMess;
    };

    /*记录日志*/
    var log=function(level,params){
        var p0=params[0],p1=params[1],p2=params[2];
        var message='',err=null, errCode=-1;
        var idx=0;

        if(p0&&util.isError(p0)){
            //p0是error，p1是message
            err=p0;message=p1;idx=2;
        }else if(!isNaN(p0)){
            //p0是数字
            errCode=p0;
            if(p1&&util.isError(p1)){
                //p1是error,p2是message
                err=p1;message=p2;idx=3;
            }else{
                //p1是message
                message=p1;idx=2;
            }
        }else{
            //p0是message
            message=p0;idx=1;
        }

        var log=formatLog(level,errCode,err,message,sliceFn.call(params,idx));
        writer.write(log,level);
    };

    var s={};
    s.level=config.LEVEL;
    s.isEnabledFor=function(level){
        return LEVEL[s.level]<=LEVEL[level];
    };

    /**创建日志方法，使用了方法重载，具体见log()
     * 可以使用如下方法调用此类的相关方法：
     * debug(errCode,err,message)
     * debug(errCode,message)
     * debug(err,message)
     * debug(message)*/
    _.each(LEVEL,function(value,key){
       s[key.toLowerCase()]=function(){
           if(isInTagFilter&&s.isEnabledFor(key))
               log(key,arguments);
       };
    });

    return s;
};

var LoggerFactory=function(configs){
    var s=LoggerFactory;
    s.configs=configs;
    s.writers={};
    s.getLogger=function(tag,type){
        type=type||'DEFAULT';
        return Logger(tag,type);
    };
    s.getLogWriter=function(type){
        type=type||'DEFAULT';
        return s.writers[type];
    };

    _.each(configs,function(value,key){
        s.writers[key]=LogWriter(key);
    });

    return s.getLogger;
};

module.exports=LoggerFactory;