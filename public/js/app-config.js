/**
 * Created by Veket on 2016/10/25.
 */
var APP_CONFIG={
    REQUIRE:{
        'paths':{
            'jquery':'lib/jquery/jquery.min',
            'jquery.cookie':'lib/jquery/jquery.cookie.min',
            'text':'lib/require/text.min',
            'css':'lib/require/css.min',
            'domReady':'lib/require/domReady.min',
            'underscore':'lib/underscore/underscore-min',
            'underscore.string':'lib/underscore/underscore.string.min',
            'router':'lib/router/kendo.router.min',
            'layer':'lib/layer/layer',
            'base64':'lib/crypto/base64.min',
            'app':'js/app-util'
        },
        'shim':{
            'jquery':{'exports':'$'},
            'underscore': {'exports': '_'},
            'underscore.string': {'exports': '_.str','deps':['underscore']},
            'layer':{'deps':['jquery']}
        },
        'urlArgs':'v=1.0.0'
    }
};
require.config(APP_CONFIG.REQUIRE);