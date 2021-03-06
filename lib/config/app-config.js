/**
 * Created by Veket on 2016/10/24.
 */
var path=require('path');

module.exports={
    SECRET_KEY:'111111',
    SERVER:{
        LISTEN_PORT:80,
        STOP_TIMEOUT:5*1000,
        SERVICE:{
            url:'/v1',
            home:'home.js',
            dir:path.join(AppCtx.APP_ROOT_DIR,'lib/service')
        },
        FILTER:{
            dir:path.join(AppCtx.APP_ROOT_DIR,'lib/filter'),
            'head':[
            ],
            'middle':[
                {file:'http-header-setter'}
            ],
            'end':[
            ]
        },
        EXPRESS_SETTINGS:{
            'trust proxy':false,
            'strict routing':false,
            'x-powered-by':false,
            'view cache':true,
            'view engine':'html'
        },
        USE_MY_SQL:true
    },
    KNEX:{
        client:'mysql',
        debug:false,
        connection:{
            host:'104.160.38.181',
            port:'3306',
            user:'root',
            password:'root',
            database:'mysql'
        },
        pool:{
            min:2,
            max:10,
            idleTimeoutMillis:60*1000,
            reapIntervalMillis:5*1000
        }
    },
    BODY_PARSER:{
        urlencoded:{
            extended:true,limit:10*1024*1024,
            parameterLimit:100000
        },
        json:{limit:10*1024*1024},
        multer:{
            dest:path.join(AppCtx.APP_ROOT_DIR,'lib/uploads'),
            limits:{fileSize:100*1024*1024}
        }
    },
    LOGGERS:{
        DEFAULT:{
            LEVEL:'DEBUG',
            WRITE_TO_CONSOLE:true,
            WRITE_TO_FILE:true,
            LOG_FILE:path.join(AppCtx.APP_ROOT_DIR,'/log/server'),
            LOG_FILE_DATE_PATTERN:'YYYYMM',
            MAX_FILE_SIZE:1024,
            FILE_SIZE_CHECK_INTERVAL:3600,
            TAG_FILTER:[/*"vk.js"*/]
        }
    },
    MAILER:{
        sender:'frveket@126.com',
        host: 'smtp.126.com',
        port: 465,
        secure: true,
        auth:{
            user:'frveket@126.com',
            pass:''
        },
        maxConnections:10,
        maxMessages:200
    }
};