( /* eslint-disable complexity */ /* eslint-disable max-statements */ /* eslint-disable no-shadow-restricted-names */
  function(ns, undefined) {
    /* eslint-enable complexity */
    /* eslint-enable max-statements */ /* eslint-enable no-shadow-restricted-names */
    var
      CONTENT_TYPE_JSON = 'application/json; charset=UTF-8',

      NODE_TYPE_ELEMENT = 1, // ELEMENT_NODE
      NODE_TYPE_COMMENT = 8, // COMMENT_NODE

      METHOD_GET = 'GET',
      METHOD_POST = 'POST',
      METHOD_PATCH = 'PATCH',
      METHOD_PUT = 'PUT',
      METHOD_DELETE = 'DELETE',

      RESERVED_MODEL_FIELDS = ['$$p', '$$m', '$$k', '$$c', '$$ignChange', '$$ctrs', '$$qp'],

      MODEL_DEF_PARAM_AUTO = 'auto',
      MODEL_DEF_PARAM_FK = 'fk',
      MODEL_DEF_PARAM_ELEMENTS = 'elements',
      MODEL_DEF_PARAM_NULL = 'null',
      MODEL_DEF_PARAM_OPTIONAL = 'optional',
      MODEL_DEF_PARAM_PK = 'pk',
      MODEL_DEF_PARAM_TYPE = 'type',

      MODEL_DEF_TYPE_BOOLEAN = 'boolean',
      MODEL_DEF_TYPE_DATE = 'date',
      MODEL_DEF_TYPE_DATETIME = 'datetime',
      MODEL_DEF_TYPE_DECIMAL = 'decimal',
      MODEL_DEF_TYPE_INTEGER = 'integer',
      MODEL_DEF_TYPE_STRING = 'string',
      MODEL_DEF_TYPE_TIME = 'time',
      MODEL_DEF_TYPE_UUID = 'uuid',

      ALLOWED_FK_PARAMS = [
        MODEL_DEF_PARAM_FK,
        MODEL_DEF_PARAM_NULL
      ],
      ALLOWED_PRIMITIVE_TYPES = [
        MODEL_DEF_TYPE_BOOLEAN,
        MODEL_DEF_TYPE_DATE,
        MODEL_DEF_TYPE_DATETIME,
        MODEL_DEF_TYPE_DECIMAL,
        MODEL_DEF_TYPE_INTEGER,
        MODEL_DEF_TYPE_STRING,
        MODEL_DEF_TYPE_TIME,
        MODEL_DEF_TYPE_UUID
      ],
      ALLOWED_PRIMITIVE_PARAMS = [
        MODEL_DEF_PARAM_NULL,
        MODEL_DEF_PARAM_OPTIONAL,
        MODEL_DEF_PARAM_TYPE,
      ],
      ALLOWED_PK_PARAMS = [
        MODEL_DEF_PARAM_AUTO,
        MODEL_DEF_PARAM_PK,
        MODEL_DEF_PARAM_TYPE,
      ],
      ALLOWED_ARRAY_PARAMS = [
        MODEL_DEF_PARAM_ELEMENTS,
        MODEL_DEF_PARAM_OPTIONAL,
        MODEL_DEF_PARAM_TYPE,
      ],
      ALLOWED_ARRAY_PRIMITIVE_PARAMS = [
        MODEL_DEF_PARAM_NULL,
        MODEL_DEF_PARAM_TYPE,
      ],

      MODEL_FIELD_TYPE_ARRAY = 'array',
      MODEL_FIELD_TYPE_FK = 'fk',
      MODEL_FIELD_TYPE_PK = 'pk',
      MODEL_FIELD_TYPE_PRIMITIVE = 'primitive',

      /**
       * 0: whole regex
       *
       * 1: ({([a-z][0-9a-zA-Z_]*)})
       *      - title enclosed in { }
       *
       * 2: ([a-z][0-9a-zA-Z_]*)
       *      - title
       *
       * 3: ([A-Za-z][0-9a-zA-Z_]+)
       *      - model name
       *
       * 4: (:(([^,:|=]+)|([a-z][0-9a-zA-Z_]*=[^,:|=]+(,[a-z][0-9a-zA-Z_]*=[^,:|]+)*)))
       *      - primary key definition starting with ':'
       *
       * 5: (([^,:|=]+)|([a-z][0-9a-zA-Z_]*=[^,:|=]+(,[a-z][0-9a-zA-Z_]*=[^,:|]+)*))
       *      - primary key definition
       *
       * 6: ([^,:|=]+)
       *      - if the 1st variation of primary key was used e.g. ModelName:2314
       *
       * 7: ([a-z][0-9a-zA-Z_]*=[^,:|=]+(,[a-z][0-9a-zA-Z_]*=[^,:|]+)*)
       *      - if the 2nd variation of primary key was used e.g. ModelName:a=2,b=3
       *
       * 8: (,[a-z][0-9a-zA-Z_]*=[^,:|]+)*
       *      - optional part of the 2nd variation e.g. ,b=3 in above example
       *
       * 9: (\|([a-z][0-9a-zA-Z_]*=[^,]+(,[a-z][0-9a-zA-Z_]*=[^,]+)*)+)
       *      - filter definition preceded by '|'
       *
       * 10: ([a-z][0-9a-zA-Z_]*=[^,]+(,[a-z][0-9a-zA-Z_]*=[^,]+)*)
       *      - filter definition
       *
       * 11: (,[a-z][0-9a-zA-Z_]*=[^,]+)*
       *      - ',<filter>' repetitions after 1st filter
       *
       * [2] -> title | undefined
       * [3] -> model
       * [5] -> primary key | undefined
       * [10] -> params/filter | undefined
       *
       * key = [3] + (':' + [5]) + ('|' + [10])
       */
      REGEX_RESOURCE =
      /^({([a-z][0-9a-zA-Z_]*)})?([A-Za-z][0-9a-zA-Z_]+)(:(([^,:|=]+)|([a-z][0-9a-zA-Z_]*=[^,:|=]+(,[a-z][0-9a-zA-Z_]*=[^,:|]+)*)))?(\|([a-z][0-9a-zA-Z_]*=[^,=]+(,[a-z][0-9a-zA-Z_]*=[^,=]+)*))?$/,

      REGEX_TEMPLATE = /({{[^{}]+}})/g,

      REGEX_META_ATTRIB = /^setu\-([a-z])([a-z]+)$/,
      REGEX_LOOP =
      /([a-zA-Z][a-zA-Z0-9_\.]*)[\s]*in[\s]*([a-zA-Z][a-zA-Z0-9_\.]+)/,
      REGEX_DECLARE = /([a-zA-Z][a-zA-Z0-9_]*)[\s]*=[\s]*(.*)+/,
      REGEX_LIST = /^list::([A-Za-z][A-Za-z0-9_]+)(\|([a-z][0-9a-zA-Z_]*=[^,=]+(,[a-z][0-9a-zA-Z_]*=[^,=]+)*))?$/,
      REGEX_CREATE = /^create::([A-Z][A-Za-z0-9_]+)$/,

      REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      REGEX_DATETIME = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])[T ](0\d|1\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\.\d+)?(Z|[+-](0\d|1[0-2]):?[0-5]\d)?$/,
      REGEX_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
      REGEX_TIME = /^(0\d|1\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\.\d+)?(Z|[+-](0\d|1[0-2]):?[0-5]\d)?$/,

      PK_TYPE_ONE = 'one',
      PK_TYPE_MULTI = 'multi',

      META_BIND = 'setu-bind',
      META_CLICK = 'setu-click',
      META_DECLARE = 'setu-declare',
      META_IF = 'setu-if',
      META_INCLUDE = 'setu-include',
      META_INSTANCE = 'setu-instance',
      META_LOOP = 'setu-loop',
      META_MODEL = 'setu-model',
      META_PASS = 'setu-pass',
      META_REQUIRE = 'setu-require',
      META_REPLACE = 'setu-replace',
      META_PARAMS = 'setu-params',
      META_ATTRIBUTES = [
        META_BIND, META_CLICK,
        META_DECLARE, META_IF,
        META_INCLUDE, META_INSTANCE,
        META_LOOP, META_MODEL,
        META_PASS, META_REQUIRE
      ],

      FORM_RELATED_AS = 'related-as',
      FORM_RELATED_TO = 'related-to',

      KW_API = 'api',
      KW_LIST = 'list',
      KW_DETAIL = 'detail',
      KW_CREATE = 'create',
      KW_UPDATE = 'update',
      KW_DELETE = 'delete',
      KW_MODEL = 'model',
      KW_INSTANCE = 'instance',
      KW_CODE = 'code',

      SETU_ELEM_NEEDED = 'needed',
      SETU_ELEM_CHILDREN = 'children',

      PARSE_FALL_THROUGH = 'parseFallThrough',
      PARSE_DONE = 'parseDone',

      MSG_BADLY_CONFIGURED = 'Improperly configured Setu application',
      MSG_INVALID_INSTANCE_DATA = 'Invalid instance data',
      MSG_INVALID_META = 'Invalid Setu meta syntax',
      MSG_INTERNAL_ERROR = 'Setu internal error',
      MSG_NO_SUPPORT = 'This browser does not support the Setu framework'

    var temp = []
    META_ATTRIBUTES.forEach(function(attr) {
      temp.push('[' + attr + ']')
    })

    var META_ATTRS_SELECTOR = temp.join(',')

    ns.MULTI_PK_TO_URL_KEY_VALUE_PATH = 'KeyValuePath'
    ns.MULTI_PK_TO_URL_ORDERED_VALUES_PATH = 'OrderedValuesPath'
    ns.MULTI_PK_TO_URL_ORDERED_SEPERATED_VALUES = 'OrderedSeparatedValues'

    ns.EVENT_LIST_RESOURCE_CREATE = 'listResourceCreate'
    ns.EVENT_LIST_RESOURCE_CHANGE = 'listResourceChange'
    ns.EVENT_DETAIL_RESOURCE_CHANGE = 'detailResourceChange'
    ns.EVENT_DETAIL_RESOURCE_DELETE = 'detailResourceDelete'
    ns.EVENT_BEFORE_ELEMENT_DELETE = 'beforeElementDelete'
    ns.EVENT_INSTANCE_CHANGE = 'instanceChange'
    ns.EVENT_INSTANCE_CREATE = 'instanceCreate'
    ns.EVENT_INSTANCE_DELETE = 'instanceDelete'
    ns.EVENT_INSTANCE_SAVE = 'instanceSave'
    ns.EVENT_META_RENDER = 'metaRender'
    ns.EVENT_PAGE_BEGIN = 'pageBegin'
    ns.EVENT_PAGE_RENDER = 'pageRender'
    ns.EVENT_FORM_SUCCESS = 'formSuccess'

    ns.ADAPTER_AJAX_BEFORE_SEND = 'ajaxBeforeSend'
    ns.ADAPTER_AJAX_ON_RESPONSE = 'ajaxOnResponse'
    ns.ADAPTER_MODELS_LIST = 'modelsList'
    ns.ADAPTER_VALIDATE_FORM = 'validateForm'
    ns.ADAPTER_TUNE_INSTANCE = 'tuneInstance'

    /* eslint-disable no-extend-native */

    Array.prototype.contains = function(element) {
      return (-1 !== this.indexOf(element))
    }

    Array.prototype.remove = function(element, howMany) {
      var idx
      if (-1 !== (idx = this.indexOf(element))) {
        this.splice(idx, howMany || 1)
      }
    }

    /* eslint-enable no-extend-native */

    function isArray(v) {
      return ('[object Array]' === Object.prototype.toString.call(v))
    }

    function isObject(v) {
      return ('object' === typeof(v) && !isArray(v))
    }

    function shuntEvent(e) {
      if (e.preventDefault) {
        e.preventDefault()
      }
      if (e.stopPropagation) {
        e.stopPropagation()
      }
    }

    var GLogLevels = {
      'error': 1,
      'warn': 2,
      'info': 3,
      'log': 4,
      'debug': 5
    }

    var GLogLevel = GLogLevels.debug

    function dummy() {}

    console.debug = console.debug || dummy
    console.log = console.log || dummy

    console.group = console.group || dummy
    console.groupEnd = console.groupEnd || dummy

    console.time = console.time || dummy
    console.timeEnd = console.timeEnd || dummy

    var consoleTime = console.time || dummy
    var consoleTimeEnd = console.timeEnd || dummy
    var consoleInfo = console.info || dummy
    var consoleWarn = console.warn || dummy
    var consoleError = console.error || dummy

    function setLogLevel(level) {
      if (GLogLevels[level]) {
        GLogLevel = GLogLevels[level]
      }
      for (level in GLogLevels) {
        if (GLogLevels[level] <= GLogLevel) {
          console[level] = console[level] || dummy
        } else {
          console[level] = dummy
        }
      }
      console.group = processDummyLogFunc('group', 'info')
      console.groupEnd = processDummyLogFunc('groupEnd', 'info')
      consoleTime = processDummyLogFunc('time', 'error')
      consoleTimeEnd = processDummyLogFunc('timeEnd', 'error')
      console.time = processDummyLogFunc('time', 'error')
      console.timeEnd = processDummyLogFunc('timeEnd', 'error')
      consoleInfo = console.info
      consoleWarn = console.warn
      consoleError = console.error
      console.debug('Setu.log', 'level', GLogLevel)
    }

    function processDummyLogFunc(member, against) {
      return (console[member] && dummy !== console[against] ?
        console[member] :
        dummy)
    }

    function datetimeFilter(dateStr) {
      return (new Date(dateStr)).toISOString()
    }

    var GFilters = {
      datetime: datetimeFilter
    }

    ns.models = {}

    ns.models.NameResolutionDefault = {

      m2p: function(name) {
        /**
         * Converts model 'Test' to path 'tests', and 'TestQuestionAnswer'
         * to 'test-question-answers'
         */
        return (
          name.replace(/^([A-Z])/, function(v) {
            return v.toLowerCase()
          })
          .replace(/([A-Z])/g, function(v) {
            return '-' + v.toLowerCase()
          }) +
          's')
      },

      p2m: function(name) {
        /**
         * Reverses what m2p does
         */
        return (
          name.replace(/^([a-z])/, function(v) {
            return v.toUpperCase()
          })
          .replace(/(-[a-z])/g, function(v) {
            return v.charAt(1).toUpperCase()
          })
          .replace(/s$/, ''))
      },

      m2i: function(name) {
        /**
         * Maps model 'Test' to its instance variable name 'test', and
         * 'TestQuestionAnswer' to 'test_question_answer'
         */
        return (
          name.replace(/^([A-Z])/, function(v) {
            return v.toLowerCase()
          })
          .replace(/([A-Z])/g, function(v) {
            return '_' + v.toLowerCase()
          }))
      },

      i2m: function(name) {
        /**
         * Reverses what m2i does
         */
        return (
          name.replace(/^([a-z])/, function(v) {
            return v.toUpperCase()
          })
          .replace(/(_[a-z])/g, function(v) {
            return v.charAt(1).toUpperCase()
          }))
      },

      m2l: function(name) {
        /**
         * Maps model 'Test' to its list variable name 'tests', and
         * 'TestQuestionAnswer' to 'test_question_answers'
         */
        return (this.m2i(name) + 's')
      },

      l2m: function(name) {
        /**
         * Reverses what m2l does
         */
        return (this.i2m(name).replace(/s$/, ''))
      }
    }

    function doAjax(method, url, options, onSuccess, onError) {
      options = options || {}
      options.method = method || METHOD_GET
      options.cache = options.cache || false
      options.beforeSend = options.beforeSend || function(xhr, settings) {
        runAdapters(ns.ADAPTER_AJAX_BEFORE_SEND, xhr, settings, this)
      }
      setupAjaxSuccessFn(options, url, method, onSuccess)
      setupAjaxErrorFn(options, url, method, onError)
      $_.ajax(url, options)
    }

    function setupAjaxSuccessFn(options, url, method, onSuccess) {
      options.success = function(data, status, url, xhr) {
        console.debug('Setu.http ajax $', url, method, status, data)
        try {
          runAdapters(ns.ADAPTER_AJAX_ON_RESPONSE, data, status, url, xhr)
        } catch (e) {
          // ignore exception as we need to get our callbacks done
        }
        if ('function' === typeof(onSuccess)) {
          onSuccess({
            data: data,
            status: status,
            xhr: xhr,
            url: url
          })
        }
      }
    }

    function setupAjaxErrorFn(options, url, method, onError) {
      options.error = function(err, status, url, xhr) {
        consoleError('Setu.http ajax !', url, method, status, err)
        try {
          runAdapters(ns.ADAPTER_AJAX_ON_RESPONSE, err, status, url, xhr)
        } catch (e) {
          // ignore exception as we need to get our callbacks done
        }
        if ('function' === typeof(onError)) {
          onError(Error(JSON.stringify({
            status: status,
            error: err,
            url: url
          })))
        }
      }
    }

    function GET(url, options, onSuccess, onError) {
      return doAjax(METHOD_GET, url, options, onSuccess, onError)
    }

    function POST(url, options, onSuccess, onError) {
      return doAjax(METHOD_POST, url, options, onSuccess, onError)
    }

    function PATCH(url, options, onSuccess, onError) {
      return doAjax(METHOD_PATCH, url, options, onSuccess, onError)
    }

    function PUT(url, options, onSuccess, onError) {
      return doAjax(METHOD_PUT, url, options, onSuccess, onError)
    }

    function DELETE(url, options, onSuccess, onError) {
      return doAjax(METHOD_DELETE, url, options, onSuccess, onError)
    }

    var GAdapters = {}

    function registerAdapter(purpose, procedure, context) {
      GAdapters[purpose] = GAdapters[purpose] || []
      GAdapters[purpose].push([context, procedure])
      console.debug('Setu.adapters +', purpose, context, procedure)
    }

    function runAdapters(purpose) {
      if (!GAdapters[purpose]) {
        return []
      }
      /**
       * It's called as follows:
       * runAdapters(purpose, arg0, arg1, arg2, ...)
       *
       * The 'arguments' var is sliced into an array and 0th
       * item is replaced with the context of each registry.
       * The registered adapter procedure is called as follows:
       * procedure(context, arg0, arg1, arg2, ...)
       */
      var args = Array.prototype.slice.apply(arguments),
        results = []
      GAdapters[purpose].forEach(function(registry) {
        args[0] = registry[0]
        results.push(registry[1].apply(null, args))
      })
      console.debug('Setu.adapters >', purpose, results)
      return results
    }

    /* The global adapters registry */
    ns.adapters = {}

    var
      GEventsConsumers = {},
      GEventsKeyedConsumers = {}

    GEventsConsumers[ns.EVENT_LIST_RESOURCE_CREATE] = []
    GEventsConsumers[ns.EVENT_FORM_SUCCESS] = []
    GEventsConsumers[ns.EVENT_PAGE_RENDER] = []
    GEventsConsumers[ns.EVENT_PAGE_BEGIN] = []
    GEventsConsumers[ns.EVENT_META_RENDER] = []

    GEventsKeyedConsumers[ns.EVENT_BEFORE_ELEMENT_DELETE] = {}
    GEventsKeyedConsumers[ns.EVENT_DETAIL_RESOURCE_CHANGE] = {}
    GEventsKeyedConsumers[ns.EVENT_DETAIL_RESOURCE_DELETE] = {}
    GEventsKeyedConsumers[ns.EVENT_INSTANCE_CHANGE] = {}
    GEventsKeyedConsumers[ns.EVENT_INSTANCE_CREATE] = {}
    GEventsKeyedConsumers[ns.EVENT_INSTANCE_DELETE] = {}
    GEventsKeyedConsumers[ns.EVENT_INSTANCE_SAVE] = {}
    GEventsKeyedConsumers[ns.EVENT_LIST_RESOURCE_CHANGE] = {}

    /**
     * Event registries (non-keyed and keyed) look as follows:
     * [cookie0, handler0, cookie1, handler1, cookie2, handler2, ...]
     */


    function registerEvent(type, handler, cookie) {
      if (-1 === GEventsConsumers[type].indexOf(cookie)) {
        GEventsConsumers[type].push(cookie)
        GEventsConsumers[type].push(handler)
        console.debug('Setu.events +', type, cookie, handler)
      }
    }

    function registerEventFrom(type, key, handler, cookie) {
      GEventsKeyedConsumers[type][key] = GEventsKeyedConsumers[type][key] || []
      if (-1 === GEventsKeyedConsumers[type][key].indexOf(cookie)) {
        GEventsKeyedConsumers[type][key].push(cookie)
        GEventsKeyedConsumers[type][key].push(handler)
        console.debug('Setu.events +', type, key, cookie, handler)
      }
    }

    function fireEvent(type, producer, data) {
      /**
       * An event subscriber can unsubscribe within the event handler.
       * Hence a copy of the registry array is used for calling all the
       * registered handlers.
       */
      var registry = GEventsConsumers[type].slice()
      for (var i = 0; i < registry.length; i += 2) {
        /**
         * Event handlers may throw exceptions. That should not prevent
         * calling all subsequent event handlers. Hence, all exceptions
         * are intercepted.
         */
        try {
          console.debug('Setu.events -->', type, producer, data, registry[i],
            registry[i + 1])
          /**
           * The event handler is called as follows:
           * handler(cookie, producer, data)
           */
          registry[i + 1](registry[i], producer, data)
        } catch (e) {
          consoleWarn('Setu.events !', type, producer, data, e.message, e.stack)
        }
      }
    }

    function fireEventTo(type, key, producer, data) {
      var registry = GEventsKeyedConsumers[type][key]
      if (registry) {
        registry = registry.slice()
        for (var i = 0; i < registry.length; i += 2) {
          try {
            console.debug('Setu.events -->', type, key, producer, data, registry[i],
              registry[i + 1])
            registry[i + 1](registry[i], producer, data)
          } catch (e) {
            consoleWarn('Setu.events !', type, key, producer, data, e.message, e.stack)
          }
        }
      }
    }

    function unregisterEvent(type, cookie) {
      GEventsConsumers[type].remove(cookie, 2)
      console.debug('Setu.events x', type, cookie)
    }

    function unregisterEventFrom(type, key, cookie) {
      var registry = GEventsKeyedConsumers[type][key]
      if (registry) {
        registry.remove(cookie, 2)
        console.debug('Setu.events x', type, key, cookie)
      }
    }

    ns.register = registerEvent
    ns.unregister = unregisterEvent

    var GWindow = window,
      GSetVars = {},
      GEvent

    function resetEvals() {
      for (var key in GSetVars) {
        if (GSetVars.hasOwnProperty(key)) {
          delete GWindow[key]
        }
      }
      GSetVars = {}
      GEvent = undefined
      console.debug('Setu.evals x all', GSetVars)
    }

    function setEvalVar(key, value) {
      GWindow[key] = value
      GSetVars[key] = true
      if ('event' === key) {
        GEvent = value
      }
      console.debug('Setu.evals +', key, GWindow[key])
    }

    function getEvalVar(key) {
      return GWindow[key]
    }

    function addEvalVars(object) {
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          var value = object[key]
          setEvalVar(key, value)
        }
      }
    }

    /* eslint-disable no-eval */

    function evalTemplate(resources, expr) {
      fixupEventGlobal(resources)
      addEvalVars(resources)
      /**
       * Template strings have these formats:
       * expr
       * expr | filter0 | filter1
       * The 2nd example is evaluated as: filter1(filter0(eval(expr)))
       */
      var ret = expr.replace(REGEX_TEMPLATE, function(match) {
        /**
         * Remove the template begin and end braces from matched template string.
         * Remove whitespace before and after '|' to allow splitting the template
         * expression around it.
         * Remove all whitespace from beginning and end of template string.
         */
        var parsed = match.replace(/[{}]/g, '').replace(/\s*\|\s*/, '|').trim()
        parts = parsed.split('|')
        try {
          var val = evalPipedExprs(parts)
          /**
           * If <undefined> is returned by the above function, it indicates
           * a failure due to template string config of any nature. In that
           * case, this function returns the matched string component itself
           * indicating the caller of this a failure in eval'ing the expression
           * passed to this function.
           */
          return undefined !== val ? val : match
        } catch (e) {
          console.log('Setu.evals ! template', match, e.message, e.stack)
          /**
           * Any failure in evaling pipe-separated template expression
           * is indicated to the caller by returning the matched string component
           * itself implying it could not be parsed or eval'd
           */
          return match
        }
      })
      unsetEvalVar(Object.keys(resources))
      /**
       * The return value is the original expression itself in case of failure.
       * This would lead to ongoing meta parsing step to fail in rendering the
       * page properly giving a visual cue to the developer. They can further
       * check the console to find out issues with the syntax then.
       */
      return ret
    }

    function evalPipedExprs(parts) {
      /**
       * For parts of a template expression separated by pipes e.g.
       * expr | filter0 | filter1
       * and to achieve the result: filter1(filter0(eval(expr)))
       * The relevant steps are tried and in case any of them results
       * in an error in template string configuration or eval, this
       * function returns <undefined> to notify the caller of this
       * function of such an error condition.
       */
      var val = eval(parts[0])
      if (undefined === val) {
        return undefined
      }
      for (var i = 1; i < parts.length; ++i) {
        var part = parts[i]
        if (part in GFilters) {
          val = GFilters[part](val)
        } else {
          return undefined
        }
        if (undefined === val) {
          return undefined
        }
      }
      return val
    }

    function evalExpr(resources, expr) {
      fixupEventGlobal(resources)
      addEvalVars(resources)
      /**
       * This function is used to typically eval expressions associated
       * with meta attrs like setu-loop, setu-if and setu-declare. Some
       * times, these expressions can be setu templates implying use of context
       * variables. Other times, these could be ready-to-eval javascript
       * expression strings. This function caters to both scenarios.
       */
      var result
      try {
        if (!expr.match(REGEX_TEMPLATE)) {
          /* Ready-to-eval javascript expression scene */
          result = eval(expr)
        } else {
          /**
           * Expression is a setu template, so first reduce it to the
           * result of parsing the template, and then eval it assuming
           * the template parsing resulted in a ready-to-eval javascript
           * expression string.
           * Since the resources to be available in runtime are already
           * in the runtime by calling addEvalVars above, the call to
           * evalTemplate is made with empty set of resources, as there
           * are no more resources to make available in runtime.
           */
          result = eval(evalTemplate({}, expr))
        }
      } catch (e) {
        console.log('Setu.evals ! expr', expr, e.message, e.stack)
        /**
         * Failure in eval'ing an expression is indicated by returing the
         * original expression itself. This would ensure that the ongoing
         * Setu meta parsing would not render the page properly indicating
         * failures visually. A developer can see the console then to know
         * the reason of rendering failure.
         */
        result = expr
      }
      unsetEvalVar(Object.keys(resources))
      return result
    }

    function fixupEventGlobal(resources) {
      if (!resources.event && GEvent && GWindow.event !== GEvent) {
        GWindow.event = GEvent
      }
    }

    /* eslint-enable no-eval */

    function unsetEvalVar(keys) {
      keys.forEach(function(key) {
        if (GWindow[key]) {
          GWindow[key] = undefined
        }
        delete GSetVars[key]
        if ('event' === key) {
          GEvent = undefined
        }
        console.debug('Setu.evals x', key, GWindow[key])
      })
    }

    ns.set = setEvalVar

    var GConfig

    function setupConfig(config) {
      GConfig = config
      if (GConfig.logLevel) {
        setLogLevel(GConfig.logLevel)
      }
      if (GConfig.adapters) {
        GConfig.adapters.forEach(function(adapterGroup) {
          ns.adapters[adapterGroup].forEach(function(adapter) {
            registerAdapter(adapter.purpose, adapter.handler)
          })
        })
      }
      console.debug('Setu.config $ setup')
    }

    function flushOnPathChangeConfig() {
      if (GConfig.pathchange && GConfig.pathchange.flush) {
        return GConfig.pathchange.flush
      }
      return undefined
    }

    if ('function' !== typeof(Object.create)) {
      consoleError('Setu.models ! Object.create not supported')
      throw new Error(MSG_NO_SUPPORT)
    }

    var GModels = {},
      GModelsFilters,
      GModelsConfig,
      GNameResolution

    function setupModels(modelsDefs, filters, config) {
      GModelsConfig = config || {
        trailingSlash: true,
        nameResolution: 'Setu.models.NameResolutionDefault',
        urlPrefix: '',
        compositePkToUrl: ns.MULTI_PK_TO_URL_KEY_VALUE_PATH,
        compositePkSeparator: '_',
        validateInstances: true
      }
      GModelsFilters = filters || {}
      /* eslint-disable no-eval */
      GNameResolution = eval(GModelsConfig.nameResolution)
      /* eslint-enable no-eval */
      parseModelsDefs(modelsDefs)
      console.debug('Setu.models $ setup')
    }

    function getModel(modelName) {
      if (!GModels[modelName]) {
        consoleError('Setu.models ! model', modelName, 'not defined by application')
        throw new TypeError(MSG_BADLY_CONFIGURED)
      }
      return GModels[modelName]
    }

    function parseModelsDefs(modelsDefs) {
      for (var modelName in modelsDefs) {
        if (modelsDefs.hasOwnProperty(modelName)) {
          var modelDef = validateModelDef(modelsDefs, modelName)
          var primaryKeys = validateModelPks(modelName, modelDef)
          GModels[modelName] = createSetuModel(modelDef, modelName, primaryKeys)
        }
      }
    }

    function validateModelDef(modelsDefs, modelName) {
      var modelDef = getModelDef(modelsDefs, modelName)
      checkReservedKWsInModel(modelName, modelDef)
      for (var field in modelDef) {
        if (modelDef.hasOwnProperty(field)) {
          validateModelFieldDef(modelsDefs, modelName, modelDef, field)
        }
      }
      return modelDef
    }

    function getModelDef(modelsDefs, modelName) {
      var modelDef = modelsDefs[modelName]
      if (!isObject(modelDef)) {
        consoleError('Setu.models !', modelName,
          'model definition must be an object', modelDef)
        throw new TypeError(MSG_BADLY_CONFIGURED)
      }
      return modelDef
    }

    function checkReservedKWsInModel(modelName, modelDef) {
      RESERVED_MODEL_FIELDS.forEach(function(reserved) {
        if (reserved in modelDef) {
          consoleError('Setu.models !', reserved,
            'is used as a field in model', modelName,
            'but it is reserved')
          throw new TypeError(MSG_BADLY_CONFIGURED)
        }
      })
    }

    function validateModelFieldDef(modelsDefs, modelName, modelDef, field) {
      /**
       * These are valid model field definition examples:
       * abc: {fk: 'OtherModel', null: true}
       * def: {fk: 'OtherModel'} --> null: false
       * ghi: {type: <non-str-primitive-type>} --> null: false, optional: false
       * jkl: {type: <str-type-primitive-type>} --> null: false, optional: false
       * mno: {type: <non-str-primitive-type>, null: true, optional: true}
       * pqr: {type: <str-type-primitive-type>, null: false, optional: true}
       * stu: {type: <primitive-type>, pk: true} --> auto: false
       * vwx: {type: <primitive-type>, pk: true, auto: true}
       * yz1: {type: 'array', elements: {type: <primitive-type>}} --> null, optional as above
       * abc: {type: 'array', elements: {fk: 'OtherModel'}} --> null, optional as above
       */
      var fieldDef = getModelFieldDef(modelName, modelDef, field),
        fieldType = getModelFieldType(modelName, field, fieldDef)
      switch (fieldType) {
        case MODEL_FIELD_TYPE_PRIMITIVE:
          validatePrimitiveFieldType(modelName, field, fieldDef, ALLOWED_PRIMITIVE_PARAMS)
          break
        case MODEL_FIELD_TYPE_PK:
          validatePkFieldType(modelName, field, fieldDef)
          break
        case MODEL_FIELD_TYPE_FK:
          validateFk(modelsDefs, modelName, field, fieldDef)
          break
        case MODEL_FIELD_TYPE_ARRAY:
          validateArrayFieldType(modelsDefs, modelName, field, fieldDef)
          break
      }
    }

    function getModelFieldDef(modelName, modelDef, field) {
      var fieldDef = modelDef[field]
      if (!isObject(fieldDef)) {
        consoleError('Setu.models !', modelName, 'model field', field,
          'definition is not an object', fieldDef)
        throw new TypeError(MSG_BADLY_CONFIGURED)
      }
      return fieldDef
    }

    function getModelFieldType(modelName, field, fieldDef) {
      ensureOneAndOnlyOneOfTypeAndFk(modelName, field, fieldDef)
      return (MODEL_DEF_PARAM_TYPE in fieldDef ?
        MODEL_FIELD_TYPE_ARRAY !== fieldDef.type ?
        !(MODEL_DEF_PARAM_PK in fieldDef) ?
        MODEL_FIELD_TYPE_PRIMITIVE :
        MODEL_FIELD_TYPE_PK :
        MODEL_FIELD_TYPE_ARRAY :
        MODEL_FIELD_TYPE_FK)
    }

    function validatePrimitiveFieldType(modelName, field, fieldDef, allowedParams) {
      forbidUnallowedFieldTypes(modelName, field, fieldDef, ALLOWED_PRIMITIVE_TYPES)
      forbidSpuriousFieldParams(modelName, field, fieldDef, allowedParams)
    }

    function validatePkFieldType(modelName, field, fieldDef) {
      validatePrimitiveFieldType(modelName, field, fieldDef, ALLOWED_PK_PARAMS)
    }

    function validateFk(modelsDefs, modelName, field, fieldDef) {
      ensureFkExists(modelsDefs, modelName, field, fieldDef)
      forbidSpuriousFieldParams(modelName, field, fieldDef, ALLOWED_FK_PARAMS)
    }

    function validateArrayFieldType(modelsDefs, modelName, field, fieldDef) {
      forbidSpuriousFieldParams(modelName, field, fieldDef, ALLOWED_ARRAY_PARAMS)
      var type = getModelArrayFieldType(modelName, field, fieldDef.elements)
      switch (type) {
        case MODEL_FIELD_TYPE_PRIMITIVE:
          validatePrimitiveFieldType(modelName, field, fieldDef.elements,
            ALLOWED_ARRAY_PRIMITIVE_PARAMS)
          break
        case MODEL_FIELD_TYPE_FK:
          validateFk(modelsDefs, modelName, field, fieldDef.elements)
          break
      }
    }

    function ensureOneAndOnlyOneOfTypeAndFk(modelName, field, fieldDef) {
      if (MODEL_DEF_PARAM_TYPE in fieldDef && MODEL_DEF_PARAM_FK in fieldDef) {
        consoleError('Setu.models !',
          'both "type" and "fk" are defined in', fieldDef,
          'in model', modelName, 'field', field)
        throw new TypeError(MSG_BADLY_CONFIGURED)
      }
      if (!(MODEL_DEF_PARAM_TYPE in fieldDef) && !(MODEL_DEF_PARAM_FK in fieldDef)) {
        consoleError('Setu.models !',
          'none of "type" and "fk" are defined in', fieldDef,
          'in model', modelName, 'field', field)
        throw new TypeError(MSG_BADLY_CONFIGURED)
      }
    }

    function ensureFkExists(modelsDefs, modelName, field, fieldDef) {
      if (!(fieldDef.fk in modelsDefs)) {
        consoleError('Setu.models !',
          'model', fieldDef.fk, 'referred to in', fieldDef,
          'as a foreign key field', field, 'in model', modelName,
          'does not exist')
        throw new TypeError(MSG_BADLY_CONFIGURED)
      }
    }

    function forbidUnallowedFieldTypes(modelName, field, fieldDef, allowed) {
      if (!allowed.contains(fieldDef.type)) {
        consoleError('Setu.models !',
          'unsupported type', fieldDef.type,
          'in', fieldDef, 'in model', modelName,
          'field', field, 'allowed ones are:', allowed)
        throw new TypeError(MSG_BADLY_CONFIGURED)
      }
    }

    function forbidSpuriousFieldParams(modelName, field, fieldDef, allowed) {
      for (var key in fieldDef) {
        if (fieldDef.hasOwnProperty(key) && !allowed.contains(key)) {
          consoleError('Setu.models !',
            'unsupported parameter', key,
            'in', fieldDef, 'in model', modelName,
            'field', field, 'allowed ones are:', allowed)
          throw new TypeError(MSG_BADLY_CONFIGURED)
        }
      }
    }

    function getModelArrayFieldType(modelName, field, elements) {
      ensureOneAndOnlyOneOfTypeAndFk(modelName, field, elements)
      return (elements.type ? MODEL_FIELD_TYPE_PRIMITIVE : MODEL_FIELD_TYPE_FK)
    }

    function validateModelPks(modelName, modelDef) {
      var primaryKeys = []
      for (var field in modelDef) {
        if (modelDef.hasOwnProperty(field) && modelDef[field].pk) {
          primaryKeys.push(field)
        }
      }
      if (!primaryKeys.length) {
        consoleError('Setu.models !', 'model', modelName,
          'does not have any primary keys defined')
        throw new TypeError(MSG_BADLY_CONFIGURED)
      }
      return primaryKeys
    }

    function createModelInstanceType(model) {
      var object = {}
      for (var field in model.def) {
        if (model.def.hasOwnProperty(field)) {
          object[field] = {
            get: (getInstanceFieldGetter(field)),
            set: (getInstanceFieldSetter(field)),
            enumerable: true
          }
        }
      }
      return object
    }

    var GInstanceFields = {},
      GInstanceFieldsCounter = 0

    function getInstanceFieldGetter(field) {
      /**
       * For any given instance field say 'xyz', there is a storage
       * attribute (to be used internally only) to support its getter
       * and setter. The value of this internal attribute is returned
       * by the getter function
       */
      return function() {
        return GInstanceFields[this.$$ctrs[field]]
      }
    }

    function getInstanceFieldSetter(field) {
      /**
       * The value of the internal storage attribute corresponding to
       * the given field is overwritten with the new value. Also, in
       * case the older value was changed, an event related to instance
       * change is fired. This is not done in case the instance is not
       * created at, where the setter would be called when the instance
       * fields are being populated. Also, if it's explicitly marked
       * to not fire an event on change, then also the event firing is
       * skippped.
       */
      return function(newValue) {
        var counter = this.$$ctrs[field],
          oldValue = GInstanceFields[counter]
        GInstanceFields[counter] = newValue
        if (oldValue !== newValue) {
          if (!this.$$c || this.$$ignChange) {
            return
          }
          onInstanceChange(this, field, oldValue, newValue)
        }
      }
    }

    function createSetuModel(modelDef, name, primaryKeys) {
      var model = {}
      model.name = name
      model.pathPrefix = GModelsConfig.urlPrefix + '/' +
        GNameResolution.m2p(model.name)
      model.def = modelDef
      model.instanceType = createModelInstanceType(model)
      model.primaryKeys = primaryKeys
      console.debug('Setu.models +', model)
      return model
    }

    function createModelInstance(model) {
      /**
       * The instanceType attribute serves as the prototype for the
       * new instance object.
       * All instance fields are initialized by undefined or an empty
       * array in case the field has an array type as per model defs
       */
      var instance = Object.create(Object.prototype, model.instanceType)
      instance.$$ctrs = {}
      for (var field in model.def) {
        instance.$$ctrs[field] = GInstanceFieldsCounter
        var fieldDef = model.def[field]
        var initValue = ('array' !== fieldDef.type ? undefined : [])
        GInstanceFields[GInstanceFieldsCounter] = initValue
          ++GInstanceFieldsCounter
      }
      instance.$$m = model
      instance.$$p = {}
      return instance
    }

    function deleteModelInstance(instance) {
      console.debug('Setu.models', Object.keys(GInstanceFields).length, 'instance fields in runtime')
      var model = instance.$$m
      for (var field in model.def) {
        var counter = instance.$$ctrs[field]
        if (counter in GInstanceFields) {
          delete GInstanceFields[counter]
        }
      }
      console.debug('Setu.models', Object.keys(GInstanceFields).length, 'instance fields in runtime')
    }

    function filterInstanceUsingModelFilter(instance, name) {
      var modelFilters = GModelsFilters[instance.$$m.name]
      if (modelFilters && 'function' === typeof(modelFilters[name])) {
        return modelFilters[name](instance)
      }
      return undefined
    }

    function getModelInstanceList(model, params, successFn, errorFn) {
      params = params || ''
      var url = getListUrl(model, params)
      GET(url, {
        format: 'json'
      }, function(response) {
        onInstanceList(model, response, successFn)
      }, function(e) {
        console.log('Setu.models ! list', model, e.message, e.stack)
        if ('function' === typeof(errorFn)) {
          errorFn([])
        }
      })
    }

    function getListUrl(model, params) {
      return model.pathPrefix +
        (params || GModelsConfig.trailingSlash ? '/' : '') +
        (params ? '?' + params : '')
    }

    function onInstanceList(model, response, successFn) {
      /**
       * Run adapters on response data. The adapters are supposed
       * to provide an array of instances after parsing the response.
       * If pagination data is available, that is returned as well.
       *
       * {count: ..., next: ..., previous: ..., list: [ .. ]}
       */
      var output = runAdapters(ns.ADAPTER_MODELS_LIST, response)[0]
      // TODO: what to do with the page information here
      var instances = []
      output.list.forEach(function(detail) {
        var instance = createModelInstance(model)
        initInstance(instance, detail)
        instances.push(instance)
      })
      console.debug('Setu.models $ list', model, instances)
      successFn(instances)
    }

    function getModelInstance(model, pk, pkType, queryParams, successFn, errorFn) {
      var url = getDetailUrl(model, pk, pkType, queryParams)
      GET(url, {
          format: 'json'
        }, function(response) {
          onInstanceDetail(model, response, successFn)
        },
        function(e) {
          console.debug('Setu.models ! detail', model, e.message, e.stack)
          if ('function' === typeof(errorFn)) {
            errorFn({})
          }
        })
    }

    function getDetailUrl(model, pk, pkType, queryParams) {
      /**
       * For single primary key in model:
       * /<model>s/:pk/
       * /<model>s/:pk/?:queryparams
       *
       * For composite primary key in model following is supported:
       *
       * GModelsConfig.compositePkToUrl === 'KeyValuePath' ==>
       * /<model>s/:key1/:value1/:key2/:value2/
       * /<model>s/:key1/:value1/:key2/:value2/?:queryparams
       *
       * GModelsConfig.compositePKToUrl === 'OrderedValuesPath' ==>
       * /<model>s/:value1/:value2/
       * /<model>s/:value1/:value2/?:queryparams
       *
       * GModelsConfig.compositePKToUrl === 'OrderedSeparatedValues' ==>
       * /<model>s/:value1<sep>:value2/
       * /<model>s/:value1<sep>:value2/?:queryparams
       */
      return (model.pathPrefix + '/' +
        pkToUrlPart(pk, pkType) +
        (GModelsConfig.trailingSlash ? '/' : '') +
        (queryParams ? '?' + queryParams : ''))
    }

    function pkToUrlPart(pk, pkType) {
      return (PK_TYPE_ONE === pkType ? pk : compositePkToUrlPath(pk))
    }

    function compositePkToUrlPath(pk) {
      switch (GModelsConfig.compositePkToUrl) {
        case ns.MULTI_PK_TO_URL_KEY_VALUE_PATH:
          return pk.replace(/,/, '/')
        case ns.MULTI_PK_TO_URL_ORDERED_VALUES_PATH:
          return compositePkOrderedValues(pk, '/')
        case ns.MULTI_PK_TO_URL_ORDERED_SEPERATED_VALUES:
          return compositePkOrderedValues(pk,
            GModelsConfig.compositePkSeparator || '_')
      }
    }

    function compositePkOrderedValues(pk, separator) {
      var keyValuePairs = pk.split(','),
        values = []
      keyValuePairs.forEach(function(keyValuePair) {
        values.push(keyValuePair.replace(/^[^=]+=/, ''))
      })
      return values.join(separator)
    }

    function onInstanceDetail(model, response, successFn) {
      var data = response.data
      var instance = createModelInstance(model)
      initInstance(instance, data)
      console.debug('Setu.models $ detail', model, pk, instance)
      successFn(instance)
    }

    function initInstance(instance, data) {
      /**
       * From a given object, copy the key-value pairs defined in
       * the model def. This ensures no ghost values enter a model
       * instance causing possible app bugs that cannot be easily
       * debugged or traced.
       */
      if (data) {
        var modelDef = instance.$$m.def,
          modelName = instance.$$m.name
        ensureRequiredFields(modelName, modelDef, data, instance.$$c)
        validateInstanceDataFields(modelName, modelDef, data, instance)
        instance.$$c = true
        instance.$$k = modelName + ':' + getInstancePrimaryKeyDef(instance)
        registerDetailResource(instance)
      }
    }

    function ensureRequiredFields(modelName, modelDef, data, instanceCreated) {
      for (var field in modelDef) {
        if (requiredInstanceField(modelDef[field], instanceCreated) &&
          !(field in data)) {
          consoleError('Setu.instances ! instance data', data,
            'for model', modelName, 'does not have required field', field)
          throw new TypeError(MSG_INVALID_INSTANCE_DATA)
        }
      }
    }

    function requiredInstanceField(fieldDef, instanceCreated) {
      /**
       * These are the conditions where a value must be provided
       * for a given model field:
       *
       * - it's a primary key, instance is not yet created (copying
       *   given data to a UI instance which would be POST'd to create
       *   a new backend instance), and there is no "auto" setting for
       *   this primary key
       * - or, it's a foreign key
       * - or, it's a primitive or array field and "optional" setting
       *   is not set to true
       */
      return (
        (fieldDef.pk && !instanceCreated && !fieldDef.auto) ||
        fieldDef.fk ||
        !fieldDef.optional)
    }

    function validateInstanceDataFields(modelName, modelDef, data, instance) {
      for (var field in data) {
        if (field in modelDef) {
          validateInstanceDataField(modelName, field, modelDef[field], data)
          instance[field] = data[field]
        }
      }
    }

    function validateInstanceDataField(modelName, field, fieldDef, data) {
      var fieldType = getModelFieldType(modelName, field, fieldDef)
      switch (fieldType) {
        case MODEL_FIELD_TYPE_PRIMITIVE:
          validatePrimitiveInstanceDataField(modelName, field, fieldDef, data)
          break
        case MODEL_FIELD_TYPE_PK:
          validatePkInstanceDataField(modelName, field, fieldDef, data)
          break
        case MODEL_FIELD_TYPE_FK:
          validateFkInstanceDataField(modelName, field, fieldDef, data)
          break
        case MODEL_FIELD_TYPE_ARRAY:
          validateArrayInstanceDataField(modelName, field, fieldDef, data)
          break
      }
    }

    function validatePrimitiveInstanceDataField(modelName, field, fieldDef, data) {
      var type = fieldDef.type,
        value = data[field]
      if (cantBeButIsNull(value, fieldDef)) {
        consoleError('Setu.instances !', modelName, 'model field', field,
          'is null in', data, 'which is not allowed')
        throw new TypeError(MSG_INVALID_INSTANCE_DATA)
      } else if (null !== value && !isPrimitiveOfType(value, type)) {
        consoleError('Setu.instances !', modelName, 'model field', field,
          'is', value, 'in', data, 'which is not of required type:', type)
        throw new TypeError(MSG_INVALID_INSTANCE_DATA)
      }
    }

    function validatePkInstanceDataField(modelName, field, fieldDef, data) {
      validatePrimitiveInstanceDataField(modelName, field, fieldDef, data)
    }

    function validateFkInstanceDataField(modelName, field, fieldDef, data) {
      /**
       * Foreign key fields can be whole objects of the related model
       * type, or they could just be values of the primary key of the
       * related model.
       *
       * In case whole object of the related model is provided, it's
       * verified against the corresponding model def
       */
      var relatedModel = getModel(fieldDef.fk)
      if (isObject(data[field])) {
        var dummy = {}
        validateInstanceDataFields(relatedModel.modelName, relatedModel.def,
          data[field], dummy)
      } else {
        var relatedPk = relatedModel.primaryKeys[0]
        validateFkAsPerRelatedModel(relatedModel.modelName, relatedPk,
          relatedModel.def[relatedPk], modelName, field, fieldDef, data)
      }
    }

    function validateFkAsPerRelatedModel(relatedName, relatedPk,
      relatedPkDef, modelName, field, fieldDef, data) {
      var relatedPkType = relatedPkDef.type,
        value = data[field]
      if (cantBeButIsNull(value, fieldDef)) {
        consoleError('Setu.instances !', modelName, 'model field', field,
          'is a foreign key to', relatedName, 'and is null in', data,
          'which is not allowed')
        throw new TypeError(MSG_INVALID_INSTANCE_DATA)
      } else if (null !== value && !isPrimitiveOfType(value, relatedPkType)) {
        consoleError('Setu.instances !', modelName, 'model field', field,
          'is a foreign key to', relatedName, 'whose primary key', relatedPk,
          'is of type', relatedPkType, 'but the value is', value,
          'in', data)
        throw new TypeError(MSG_INVALID_INSTANCE_DATA)
      }
    }

    function validateArrayInstanceDataField(modelName, field, fieldDef, data) {
      if (!isArray(data[field])) {
        consoleError('Setu.instances !', modelName, 'model field', field,
          'must be an array but the value is', data[field], 'in', data)
        throw new TypeError(MSG_INVALID_INSTANCE_DATA)
      }
      var type = getModelArrayFieldType(modelName, field, fieldDef.elements)
      switch (type) {
        case MODEL_FIELD_TYPE_PRIMITIVE:
          validatePrimitiveArrayInstanceDataField(modelName, field, fieldDef.elements, data)
          break
        case MODEL_FIELD_TYPE_FK:
          validateFkArrayInstanceDataField(modelName, field, fieldDef.elements, data)
          break
      }
    }

    function validatePrimitiveArrayInstanceDataField(modelName, field, elemsDef, data) {
      var type = elemsDef.type
      data[field].forEach(function(element) {
        if (cantBeButIsNull(element, elemsDef)) {
          consoleError('Setu.instances !', modelName, 'model array field', field,
            'contains a null element in', data, 'which is not allowed')
        } else if (null !== element && !isPrimitiveOfType(element, type)) {
          consoleError('Setu.instances !', modelName, 'model array field', field,
            'has', element, 'in', data, 'which is not of required type:', type)
          throw new TypeError(MSG_INVALID_INSTANCE_DATA)
        }
      })
    }

    function validateFkArrayInstanceDataField(modelName, field, elemsDef, data) {
      data[field].forEach(function(element) {
        var relatedModel = getModel(elemsDef.fk)
        if (isObject(element)) {
          var dummy = {}
          validateInstanceDataFields(relatedModel.modelName, relatedModel.def,
            element, dummy)
        } else {
          var relatedPk = relatedModel.primaryKeys[0]
          validateFkArrayElementAsPerRelatedModel(relatedModel.modelName, relatedPk,
            relatedModel.def[relatedPk], modelName, element, elemsDef, data)
        }
      })
    }

    function validateFkArrayElementAsPerRelatedModel(relatedName, relatedPk,
      relatedPkDef, modelName, element, elemsDef, data) {
      var relatedPkType = relatedPkDef.type
      if (cantBeButIsNull(element, elemsDef)) {
        consoleError('Setu.instances !', modelName, 'model field', field,
          'contains foreign keys to', relatedName, 'and cannot have nulls',
          'but nulls are there in', data)
        throw new TypeError(MSG_INVALID_INSTANCE_DATA)
      } else if (null !== element && !isPrimitiveOfType(element, relatedPkType)) {
        consoleError('Setu.instances !', modelName, 'model field', field,
          'contains foreign keys to', relatedName, 'whose primary key', relatedPk,
          'is of type', relatedPkType, 'but value of an array element', element,
          'in', data, 'does not match the type')
        throw new TypeError(MSG_INVALID_INSTANCE_DATA)
      }
    }

    function cantBeButIsNull(value, fieldDef) {
      return (null === value && !fieldDef.null)
    }

    function isPrimitiveOfType(primitive, type) {
      switch (type) {
        case MODEL_DEF_TYPE_BOOLEAN:
        case MODEL_DEF_TYPE_STRING:
          return (type === typeof(primitive))
        case MODEL_DEF_TYPE_INTEGER:
          return ('number' === typeof(primitive) && !primitive.toString().match(/\./))
        case MODEL_DEF_TYPE_DECIMAL:
          return ('number' === typeof(primitive))
        case MODEL_DEF_TYPE_DATETIME:
          return ('string' === typeof(primitive) && primitive.match(REGEX_DATETIME))
        case MODEL_DEF_TYPE_DATE:
          return ('string' === typeof(primitive) && primitive.match(REGEX_DATE))
        case MODEL_DEF_TYPE_TIME:
          return ('string' === typeof(primitive) && primitive.match(REGEX_TIME))
        case MODEL_DEF_TYPE_UUID:
          return ('string' === typeof(primitive) && primitive.match(REGEX_UUID))
      }
      return false
    }

    function getInstancePrimaryKeyDef(instance) {
      if (1 === instance.$$m.primaryKeys.length) {
        return instance[instance.$$m.primaryKeys[0]]
      } else {
        var keyValuePairs = []
        instance.$$m.primaryKeys.forEach(function(pk) {
          keyValuePairs.push(pk + '=' + instance[pk])
        })
        return keyValuePairs.join(',')
      }
    }

    function onInstanceChange(instance, field, oldVal, newVal) {
      /**
       * When a field of an instance changes, detected by the setter,
       * mark that as dirty and fire event to those waiting to trap
       * and process such a change in this specific instance.
       */
      instance.$$p[field] = true
      fireEventTo(ns.EVENT_INSTANCE_CHANGE, instance.$$k, instance, {
        field: field,
        oldVal: oldVal,
        newVal: newVal
      })
    }

    function saveInstance(instance, successFn, errorFn) {
      if (instance.$$c) {
        return updateInstance(instance, successFn, errorFn)
      } else {
        return createInstance(instance, successFn, errorFn)
      }
    }

    function createInstance(instance, successFn, errorFn) {
      if (checkIfInstanceCreatedAlready(instance, successFn)) {
        return
      }
      POST(getInstanceCreateUrl(instance), {
        data: getInstanceCreatePostData(instance),
        contentType: CONTENT_TYPE_JSON,
        format: 'json'
      }, function(response) {
        initInstance(instance, response.data)
        console.debug('Setu.instances +', instance)
        fireEventTo(ns.EVENT_INSTANCE_CREATE, instance.$$m.name,
          instance)
        successFn(instance)
      }, function(e) {
        console.debug('Setu.instances ! create', e.message, e.stack)
        if ('function' === typeof(errorFn)) {
          errorFn({})
        }
      })
    }

    function checkIfInstanceCreatedAlready(instance, successFn) {
      if (instance.$$c) {
        consoleError('Setu.instances',
          'internal programming error or user-forced recreation ' +
          'of an already created instance',
          instance)
        successFn(instance)
        return true
      }
      return false
    }

    function getInstanceCreateUrl(instance) {
      var url = instance.$$m.pathPrefix +
        (GModelsConfig.trailingSlash ? '/' : '')
      if (instance.$$qp) {
        url += '?' + instance.$$qp
        delete instance.$$qp
      }
      return url
    }

    function getInstanceCreatePostData(instance) {
      var dataToSend = {}
      for (var field in instance.$$m.def) {
        if (instance.$$m.def.hasOwnProperty(field) && !instance.$$m.def[field].auto) {
          dataToSend[field] = instance[field]
        }
      }
      return dataToSend
    }

    function updateInstance(instance, successFn, errorFn) {
      if (checkIfInstanceNotCreated(instance, successFn)) {
        return
      }
      var dataToSend = getInstanceUpdatePatchData(instance)
      if (!dataToSend) {
        return
      }
      PATCH(getInstanceUrl(instance), {
        data: dataToSend,
        contentType: CONTENT_TYPE_JSON,
        format: 'json'
      }, function(response) {
        updateInstanceWithResponse(instance, response)
        successFn(instance)
      }, function(e) {
        console.debug('Setu.instances ! update', instance, e.message, e.stack)
        if ('function' === typeof(errorFn)) {
          errorFn({})
        }
      })
    }

    function checkIfInstanceNotCreated(instance, successFn) {
      if (!instance.$$c) {
        consoleError('Setu.instances',
          'internal programming error or user forced update of an ' +
          'instance that does not exist in backend',
          instance)
        successFn(instance)
        return true
      }
      return false
    }

    function getInstanceUrl(instance) {
      var model = instance.$$m,
        pkType = (1 === model.primaryKeys.length ? PK_TYPE_ONE : PK_TYPE_MULTI),
        pk = getInstancePk(model, pkType, instance),
        url = getDetailUrl(model, pk, pkType, instance.$$qp)
      if (instance.$$qp) {
        delete instance.$$qp
      }
      return url
    }

    function getInstancePk(model, pkType, instance) {
      return PK_TYPE_ONE === pkType ?
        instance[model.primaryKeys[0]] :
        getInstanceCompositePk(model.primaryKeys, instance)
    }

    function getInstanceCompositePk(primaryKeys, instance) {
      var pkArr = []
      primaryKeys.forEach(function(pk) {
        pkArr.push(pk + '=' + instance[pk])
      })
      return pkArr.join(',')
    }

    function getInstanceUpdatePatchData(instance) {
      var dataToSend = {}
      for (var field in instance.$$p) {
        if (instance.$$p.hasOwnProperty(field)) {
          dataToSend[field] = instance[field]
        }
      }
      return (Object.keys(dataToSend).length ? dataToSend : null)
    }

    function updateInstanceWithResponse(instance, response) {
      var data = response.data,
        modelDef = instance.$$m.def,
        modelName = instance.$$m.name
      /**
       * Since this is just a confirmatory update, we don't want to raise
       * spurious instance change events
       */
      instance.$$ignChange = true
      validateInstanceDataFields(modelName, modelDef, data, instance)
      /* Instance update is complete. No fields are dirty any more. */
      instance.$$p = {}
      /* Any changes to the instance post should resume firing change events */
      instance.$$ignChange = false
      console.debug('Setu.instances ~', instance)
      fireEventTo(ns.EVENT_INSTANCE_SAVE, modelName, instance)
    }

    function deleteInstance(instance) {
      DELETE(getInstanceUrl(instance), {
        format: 'json'
      }, function(response) {
        /* Notify elements bound directly to this instance resource */
        fireEventTo(ns.EVENT_INSTANCE_DELETE, instance.$$k, instance)
        /* Notify lists that are listening for this instance's delete */
        fireEventTo(ns.EVENT_INSTANCE_DELETE, instance.$$m.name, instance)
        purgeInstance(instance)
      }, function(e) {
        consoleInfo('Setu.instances ! delete', instance, e.message, e.stack)
      })
    }

    function purgeInstance(instance) {
      deleteModelInstance(instance)
      flushResource(instance.$$k)
    }

    function registerListForEvents(list) {
      if (!list.registered) {
        /**
         * A list resource registers events for creation, update,
         * and deletion of an instance of the model of this list.
         */
        registerEventFrom(ns.EVENT_INSTANCE_CREATE, list.model.name,
          handleInstanceCreateForList, list)
        registerEventFrom(ns.EVENT_INSTANCE_SAVE, list.model.name,
          handleInstanceSaveForList, list)
        registerEventFrom(ns.EVENT_INSTANCE_DELETE, list.model.name,
          handleInstanceDeleteForList, list)
        list.registered = true
      }
    }

    function unregisterListFromEvents(list) {
      if (list.registered) {
        unregisterEventFrom(ns.EVENT_INSTANCE_CREATE, list.model.name, list)
        unregisterEventFrom(ns.EVENT_INSTANCE_SAVE, list.model.name, list)
        unregisterEventFrom(ns.EVENT_INSTANCE_DELETE, list.model.name, list)
        list.registered = false
      }
    }

    function handleInstanceCreateForList(list, instance) {
      /**
       * A list of a given model may or may not use filters. Hence,
       * a newly created instance may or may not belong to a given
       * list corresponding to the relevant model.
       */
      if (doesInstanceBelongToList(list, instance)) {
        addInstanceToList(list, instance)
      }
    }

    function handleInstanceSaveForList(list, instance) {
      /**
       * A modified/updated instance may change which model filters
       * it passes and hence its membership to existing lists of the
       * given model may change after update.
       *
       * It may happen that the given instance was not part of this
       * list resource, and now it should be, as it passes the list
       * filter (or the generic list without filters).
       *
       * It may happen that the given instance was part of this list
       * resource, and not it should not be a part, as it fails the
       * list filter.
       */
      var belongs = doesInstanceBelongToList(list, instance)
      var isMember = list.value.contains(instance)
      if (belongs && !isMember) {
        addInstanceToList(list, instance)
      } else if (!belongs && isMember) {
        removeInstanceFromList(list, instance)
      } else if (belongs) {
        reloadListOnChange(list)
      }
    }

    function handleInstanceDeleteForList(list, instance) {
      if (list.value.contains(instance)) {
        removeInstanceFromList(list, instance)
      }
    }

    function doesInstanceBelongToList(list, instance) {
      if (list.params) {
        /**
         * This list resource has filtering/searching params defined,
         * so we try to match the instance against these params.
         */
        for (var field in list.params) {
          /**
           * Check all the filtering/searching params keys. The instance
           * must match all of them, or else it does not belong to list
           */
          if (field in instance) {
            /**
             * Since the list resource params key exists in the instance,
             * this means this is a Model field. In this case, the value
             * of this field in the instance must match the value of the
             * corresponding list resource params key.
             */
            if (!listParamMatchesInstanceField(list.params[field], instance[field])) {
              console.debug('Setu.lists', instance, 'not in', list)
              return false
            }
          } else {
            /**
             * This key in the list resource params does not exist as a field
             * in the given instance. This means that the key is used for
             * some applied non-trivial filtering not equivalent to filtering
             * by a value of a known Model field. For such keys, typically a
             * model filter would be defined, which is a function that would
             * test a given instance to figure out if it matches this params
             * filtering key. If no such model filtering function exists, then
             * calling filterInstanceUsingModelFilter for this key results in
             * undefined, which eventually implies that the instance does not
             * belong to the list resource.
             */
            if (list.params[key] !== filterInstanceUsingModelFilter(instance, key)) {
              console.debug('Setu.lists', instance, 'not in', list)
              return false
            }
          }
        }
      }
      return true
    }

    function listParamMatchesInstanceField(paramsField, instanceField) {
      try {
        return 'string' !== typeof(instanceField) ?
          eval(paramsField) === instanceField :
          paramsField === instanceField
      } catch (e) {
        return false
      }
    }

    function addInstanceToList(list, instance) {
      list.value.unshift(instance)
      console.debug('Setu.lists [+]', list, instance)
      if (list.value.length > 1) {
        /**
         * The list had at least 1 element already, so some elements
         * rendered using its existing version may have binds and would
         * be waiting to be notified for re-rendering on change in the
         * list. Reload the list from backend and fire event to such
         * bound elements.
         */
        reloadListOnChange(list)
      } else {
        /**
         * The list had no elements, so some elements depending on
         * having at least one element in the list may be hidden but
         * have a bind defined. To get them to be re-rendered, fire
         * an event to notify them that now there is one element to
         * use and re-render them
         */
        reloadListResource(list, function(results) {
          fireEvent(ns.EVENT_LIST_RESOURCE_CREATE, list)
        })
      }
    }

    function removeInstanceFromList(list, instance) {
      list.value.remove(instance)
      console.debug('Setu.lists [-]', list, instance)
      /**
       * Reload the changed list after removing this instance from it
       * and notify those that are bound to this list resource to
       * re-render themselves
       */
      reloadListOnChange(list)
    }

    function reloadListOnChange(list) {
      reloadListResource(list, function(results) {
        fireEventTo(ns.EVENT_LIST_RESOURCE_CHANGE, list.key, list)
      })
    }

    function registerDetailForEvents(detail) {
      if (!detail.registered) {
        /**
         * This detail resource has an instance as a value, and
         * it looks for changes and deletion of corresponding instances
         * to update components effected/bound to the instance changed
         * or deleted, directly or through a list that contains this
         * instance
         */
        registerEventFrom(ns.EVENT_INSTANCE_CHANGE, detail.value.$$k,
          handleInstanceChangeForDetail, detail)
        registerEventFrom(ns.EVENT_INSTANCE_DELETE, detail.value.$$k,
          handleInstanceDeleteForDetail, detail)
        detail.registered = true
      }
    }

    function unregisterDetailFromEvents(detail) {
      if (detail.registered) {
        unregisterEventFrom(ns.EVENT_INSTANCE_CHANGE, detail.value.$$k, detail)
        unregisterEventFrom(ns.EVENT_INSTANCE_DELETE, detail.value.$$k, detail)
        detail.registered = false
      }
    }

    function handleInstanceChangeForDetail(detail, instance, data) {
      /* Let components bound to the changed instance know */
      data.key = detail.key
      fireEventTo(ns.EVENT_DETAIL_RESOURCE_CHANGE, detail.key, detail,
        data)
    }

    function handleInstanceDeleteForDetail(detail) {
      /* Let elements bound to this detail resource know */
      fireEventTo(ns.EVENT_DETAIL_RESOURCE_DELETE, detail.key, detail)
    }

    var GResources,
      GResourcesDefs

    function setupResources(defs) {
      GResourcesDefs = defs
      GResources = {}
      console.debug('Setu.resources $ setup')
    }

    function resourcesIfAllExist(which) {
      /**
       * Check if *all* resources as specified by 'which' param
       * exist in the registry. If so, return the title:value
       * pairs corresponding to all of them. If even one of these
       * resources is not available ('value' attrib not set), then
       * return false.
       * All elements in the 'which' array are expected to be the
       * resource objects, and not strings. The point of this design
       * is to be specific to the usage of such a function, because
       * it's never called generically; but always in cases where the
       * resource objects are already accessible, so it avoids adding
       * the load of dissecting the resource keys by refusing to
       * entertain or expect resource key strings inside 'which'.
       */
      if (!which || !which.length) {
        return false
      }
      var resources = {}
      which.every(function(res) {
        var title = res.title,
          resource
        if ((resource = GResources[res.key]) && resource.value) {
          resources[title] = resource.value
          return true
        } else {
          resources = false
          return false
        }
      })
      return resources
    }

    function getResources(which, needed, successFn) {
      if (!which || !which.length) {
        successFn({})
        return
      }
      console.time('resources')
      var results = {}
      which.forEach(function(res) {
        var resource = 'string' === typeof(res) ?
          dissectResourceKey(needed, res) :
          res
        resource = fixupResourceRegistry(resource)
        fetchOrTapResource(resource, function(result) {
          results[result.title] = result.value
          if (Object.keys(results).length === which.length) {
            /**
             * Since there could be a fetch from backend involved
             * for at least 1 of the resources, this is the right
             * place to check if we have got all required resources
             */
            console.debug('Setu.resources obtained', results)
            console.timeEnd('resources')
            successFn(results)
          }
        })
      })
    }

    function dissectResourceKey(needed, key) {
      var def = GResourcesDefs[key]
      if (def) {
        return buildApiResource(key, def)
      }
      return parseEntityResourceKey(needed, key)
    }

    function buildApiResource(key, def) {
      return {
        type: 'api',
        key: key,
        title: key,
        api: def
      }
    }

    function parseEntityResourceKey(needed, key) {
      var resource = {},
        saveKey = key
      key = parseResourceKeyTemplates(key, needed)
      var match = matchResourceKeyWithRegex(key, saveKey)
      resource.key = buildResourceKeyFromRegexMatch(match)
      resource.model = getModel(match[3]) // match[3] -> model
      buildResourceParams(match, resource)
      buildResourcePkAndType(match, resource)
      resource.title = match[2] || // match[2] -> title
        getGenericResourceTitle(resource)
      console.debug('Setu.resources $ parsed', saveKey, key, resource)
      return resource
    }

    function parseResourceKeyTemplates(key, needed) {
      if (key.match(REGEX_TEMPLATE)) {
        try {
          key = evalTemplate(needed, key)
        } catch (e) {
          /**
           * Any template eval or other related exceptions are ignored
           * for continuity and to eventually provide visual clue to
           * developer by showing unrendered templates
           */
          console.log('Setu.resources ! key templates', key, e.message, e.stack)
        }
      }
      return key
    }

    function matchResourceKeyWithRegex(key, saveKey) {
      var match = key.match(REGEX_RESOURCE)
      if (!match || 12 !== match.length) {
        consoleError('Setu.resources !', 'invalid resource key', saveKey)
        throw new TypeError(MSG_INVALID_META)
      }
      return match
    }

    function buildResourceKeyFromRegexMatch(match) {
      return (match[3] + // Model
        (match[5] ? (':' + match[5]) : '') + // Primary Key
        (match[10] ? ('|' + match[10]) : '')) // Filter Params
    }

    function buildResourceParams(match, resource) {
      if (match[10]) { // match[10] -> params
        resource.params = fromCommaSeparatedPairsToObj(match[10])
        resource.queryparams = match[10].replace(/,/g, '&')
      }
    }

    function fromCommaSeparatedPairsToObj(str) {
      /**
       * These are the possible formats for str:
       * - a=3
       * - a=3,b=3,c=3,..
       */
      var pairs = str.split(','),
        obj = {}
      pairs.forEach(function(pair) {
        var parts = pair.split('=')
        obj[parts[0]] = parts[1]
      })
      return obj
    }

    function buildResourcePkAndType(match, resource) {
      if (match[5]) { // match[5] -> pk (one or multi)
        resource.pk = match[5]
        /* Multi-type PK if it's a comma separated list */
        resource.pkType = (match[5].match(/,/) ? PK_TYPE_MULTI : PK_TYPE_ONE)
        resource.type = KW_DETAIL
      } else {
        resource.type = KW_LIST
      }
    }

    function getGenericResourceTitle(resource) {
      return (KW_DETAIL === resource.type ?
        GNameResolution.m2i(resource.model.name) :
        GNameResolution.m2l(resource.model.name))
    }

    function fixupResourceRegistry(resource) {
      if (!GResources[resource.key]) {
        GResources[resource.key] = resource
        console.debug('Setu.resources +', resource.key, resource)
      } else {
        resource = GResources[resource.key]
        console.debug('Setu.resources .', resource.key, resource)
      }
      return resource
    }

    function fetchOrTapResource(resource, successFn) {
      switch (resource.type) {
        case KW_LIST:
          getListResource(resource, successFn)
          break
        case KW_DETAIL:
          getDetailResource(resource, successFn)
          break
        case KW_API:
          getApiResource(resource, successFn)
          break
      }
    }

    function getListResource(resource, successFn, forceFetch) {
      if (resource.value && !forceFetch) {
        successFn(resourceRep(resource))
      } else {
        getModelInstanceList(resource.model, resource.queryparams, function(list) {
          resource.value = resource.value || []
          list.forEach(function(element) {
            resource.value.push(element)
          })
          registerListForEvents(resource)
          successFn(resourceRep(resource))
        }, function(empty) {
          successFn({
            title: resource.title,
            value: empty
          })
        })
      }
    }

    function reloadListResource(resource, successFn) {
      while (resource.value.length) {
        purgeInstance(resource.value.pop())
      }
      getListResource(resource, successFn, true)
    }

    function getDetailResource(resource, successFn) {
      if (resource.value) {
        successFn(resourceRep(resource))
      } else {
        getModelInstance(resource.model, resource.pk, resource.pkType,
          resource.queryparams,
          function(instance) {
            resource.value = instance
            registerDetailForEvents(resource)
            successFn(resourceRep(resource))
          },
          function(empty) {
            successFn({
              title: resource.title,
              value: empty
            })
          })
      }
    }

    function getApiResource(resource, successFn) {
      if (resource.value) {
        successFn(resourceRep(resource))
      } else {
        GET(resource.api, {
          format: 'json'
        }, function(response) {
          resource.value = response.data
          successFn(resourceRep(resource))
        }, function(e) {
          successFn({
            title: resource.title
          })
        })
      }
    }

    function resourceRep(resource) {
      return {
        title: resource.title,
        value: resource.value
      }
    }

    function flushResource(key) {
      if (key in GResources) {
        unregisterResource(GResources[key])
        delete GResources[key]
      }
      console.debug('Setu.resources x', key)
    }

    function flushAllResources() {
      for (var key in GResources) {
        if (GResources.hasOwnProperty(key)) {
          flushResource(key)
        }
      }
      console.debug('Setu.resources []')
    }

    function registerDetailResource(instance) {
      if (!(instance.$$k in GResources)) {
        var resource = {
          key: instance.$$k,
          model: instance.$$m,
          pk: getInstancePrimaryKeyDef(instance),
          pkType: (1 === instance.$$m.primaryKeys.length) ? PK_TYPE_ONE : PK_TYPE_MULTI,
          title: GNameResolution.m2i(instance.$$m.name),
          type: KW_DETAIL,
          value: instance
        }
        registerDetailForEvents(resource)
        GResources[instance.$$k] = resource
        console.debug('Setu.resources + instance', instance)
      }
    }

    function unregisterResource(resource) {
      if (KW_LIST === resource.type) {
        unregisterListFromEvents(resource)
      } else if (KW_DETAIL === resource.type) {
        unregisterDetailFromEvents(resource)
      }
    }

    ns.get = getResources

    function containsMeta(element) {
      return (hasMetaAttribs(element) ||
        containsTemplates(element) ||
        element.querySelectorAll(META_ATTRS_SELECTOR).length)
    }

    function containsTemplates(element) {
      return (element.outerHTML && element.outerHTML.match(REGEX_TEMPLATE))
    }

    function hasMetaAttribs(element) {
      for (var idx = 0; idx < META_ATTRIBUTES.length; ++idx) {
        if (element.hasAttribute(META_ATTRIBUTES[idx])) {
          return true
        }
      }
      return false
    }

    function parseMetaClick(element) {
      var str = element.getAttribute(META_CLICK),
        parsed
      if (!str) {
        return null
      }
      var match
      if (-1 !== [KW_DETAIL, KW_UPDATE, KW_DELETE].indexOf(str)) {
        return {
          type: str
        }
      } else if (match = str.match(REGEX_LIST)) {
        return {
          type: KW_LIST,
          modelName: match[1],
          filter: match[3]
        }
      } else if (match = str.match(REGEX_CREATE)) {
        return {
          type: KW_CREATE,
          modelName: match[1]
        }
      } else {
        return {
          type: KW_CODE,
          code: str
        }
      }
    }

    function parseMetaFormModelOrInstance(form) {
      if (form.hasAttribute(META_MODEL)) {
        return {
          type: KW_MODEL,
          model: getModel(form.getAttribute(META_MODEL))
        }
      } else if (form.hasAttribute(META_INSTANCE)) {
        var resourceKey = form.getAttribute(META_INSTANCE)
        var resource = dissectResourceKey(form.$s.needed, resourceKey)
        if (KW_DETAIL !== resource.type) {
          consoleError('Setu.meta !', 'invalid instance resource key', resourceKey, form)
          throw new TypeError(MSG_INVALID_META)
        }
        return {
          type: KW_INSTANCE,
          resource: resource
        }
      }
      return null
    }

    function parseMetaBindSpec(element) {
      return parseMetaResourceKeysList(element, META_BIND)
    }

    function parseMetaRequireSpec(element) {
      return parseMetaResourceKeysList(element, META_REQUIRE)
    }

    function parseMetaResourceKeysList(element, attrib) {
      if (!element.hasAttribute(attrib)) {
        return []
      }
      var array = element.getAttribute(attrib).split(',')
      for (var i = 0; i < array.length; ++i) {
        var resource = dissectResourceKey(element.$s.needed, array[i])
        if (KW_LIST !== resource.type && KW_DETAIL !== resource.type) {
          consoleError('Setu.meta !', 'invalid key', attrib, array[i], element)
          throw new TypeError(MSG_INVALID_META)
        }
        array[i] = resource
      }
      return array
    }

    var ScopesKeyCounter = 10000

    function overwriteMetaScope(element, data) {
      $_(element).before(data)
      var newElement = $_(element).previous().element,
        parent = element.$s.parent
      newElement.$s = element.$s
      removeMetaScope(element)
      if (parent) {
        parent.$s.children.push(newElement)
        newElement.$s.parent = parent
      }
      return newElement
    }

    function createLoopIterationElement(element, iterator) {
      element.$s.needed[element.$s.contextKey] = iterator
      var html = element.outerHTML
      if (html.match(REGEX_TEMPLATE)) {
        $_(element).before(evalTemplate(element.$s.needed, html))
      } else {
        $_(element).before(html)
      }
      var sibling = $_(element).previous().element
      sibling.removeAttribute(META_LOOP)
      setupSiblingSetu(element, sibling)
      return sibling
    }

    function createBindScopeSibling(element) {
      var setu = element.$s
      if (!setu) {
        consoleError('Setu.scopes !', 'internal error while trying to eval binds',
          element)
        throw new Error(MSG_INTERNAL_ERROR)
      }
      $_(element).before(evalTemplate(setu.needed, setu.template))
      var sibling = $_(element).previous().element
      setupSiblingSetu(element, sibling)
      $_(element).getClass().split(' ').forEach(function(cls) {
        $_(sibling).addClass(cls)
      })
      return sibling
    }

    function setupSetu(element) {
      element.$s = element.$s || {}
      element.$s.key = ScopesKeyCounter
        ++ScopesKeyCounter
      console.debug('Setu.scopes $ setup setu', element, element.$s)
    }

    function removeMetaScope(element) {
      var setu = element.$s
      removeSetuChildren(setu)
      detachSetuParent(setu, element)
      fireEventTo(ns.EVENT_BEFORE_ELEMENT_DELETE, setu.key, element)
      if (element.parentNode) {
        $_(element).remove()
      }
      console.debug('Setu.scopes x', element)
    }

    function removeSetuChildren(setu) {
      if (setu.children && setu.children.length) {
        console.group()
        var children = setu.children.slice()
        children.forEach(function(child) {
          removeMetaScope(child)
        })
        console.groupEnd()
        delete setu.children
      }
    }

    function detachSetuParent(setu, element) {
      if (setu.parent) {
        setu.parent.$s.children.remove(element)
        delete setu.parent
      }
    }

    function removeDanglingScopes(elements) {
      elements.forEach(function(element) {
        // Each has to be explicitly removed to ensure the parentNode
        // null check works. Otherwise it was not.
        if (element.$s) {
          removeMetaScope(element)
        } else if (element.parentNode) {
          $_(element).remove()
        }
      })
      while (elements.length) {
        elements.pop()
      }
    }

    function setupChildSetu(element, child) {
      child.$sEvalingParent = false
      child.$s = child.$s || {}
      child.$s.needed = child.$s.needed || {}
      copySetuNeededField(element.$s, child.$s)
      child.$s.contextKey = element.$s.contextKey
      child.$s.parent = element
      console.debug('Setu.scopes', child, child.$s, '^', element, element.$s)
    }

    function hideSetuScope(element) {
      var position = {}
      position.parent = element.parentNode
      position.index = $_(element).index()
      position.data = element.outerHTML
      position.$s = element.$s
      removeMetaScope(element)
      console.debug('Setu.scopes _', META_IF, position)
      return position
    }

    function showHiddenSetuScope(position) {
      if (null === position.parent.parentNode) {
        consoleWarn('Setu.scopes !', 'ignoring hidden element under dead parent',
          position)
        return
      }
      restoreHiddenScope(position)
      var element = $_(position.parent).nthChild(position.index).element
      element.$s = position.$s
      attachSetuParent(element, getSetuParent(element))
      console.debug('Setu.scopes $ rebirth', position, element, element.$s)
      return element
    }

    function restoreHiddenScope(position) {
      if (position.index > 0) {
        $_(position.parent).nthChild(position.index - 1).after(position.data)
      } else {
        $_(position.parent).prepend(position.data)
      }
    }

    function getSetuParent(element) {
      var parent = element.parentNode
      while (parent && !parent.$s) {
        parent = parent.parentNode
      }
      return parent
    }

    function attachSetuParent(element, parent) {
      if (parent) {
        parent.$s.children = parent.$s.children || []
        parent.$s.children.push(element)
        element.$s.parent = parent
      }
    }

    function setupSiblingSetu(element, sibling) {
      var sibling$s = sibling.$s = {
        needed: {}
      }
      var setu = element.$s
      for (var key in setu) {
        if (setu.hasOwnProperty(key)) {
          switch (key) {
            case SETU_ELEM_NEEDED:
              copySetuNeededField(setu, sibling$s)
              break
            case SETU_ELEM_CHILDREN:
              break
            default:
              sibling$s[key] = setu[key]
          }
        }
      }
      if (setu.parent) {
        setu.parent.$s.children.push(sibling)
      }
    }

    function copySetuNeededField(from, to) {
      for (var title in from.needed) {
        if (from.needed.hasOwnProperty(title)) {
          to.needed[title] = from.needed[title]
        }
      }
    }

    var GHidden = [],
      GParserQueue = [],
      GParserRunning = false,
      GParserWaitForCount = 0,
      GParserNewCount = 0,
      GPostMetaDone = false

    function resetParser() {
      GHidden = []
      GParserQueue = []
      GParserRunning = false
      GParserWaitForCount = 0
      GParserNewCount = 0
      GPostMetaDone = false
      console.debug('Setu.parser x')
    }

    function runParser() {
      if (GParserRunning) {
        console.debug('Setu.parser running already...')
        return
      }
      console.debug('Setu.parser >', GParserQueue.length, 'waiting',
        GParserWaitForCount, 'new', GParserNewCount)
      if (onEmptyParserQueue()) {
        return
      }
      initParserRun()
      parseNewScopes()
      parserEndgame()
      fireEvent(ns.EVENT_META_RENDER, ns)
      postParserRun()
    }

    function onEmptyParserQueue() {
      if (!GParserQueue.length) {
        console.debug('Setu.parser $ nothing to do')
        if (!GParserWaitForCount && !GParserNewCount) {
          postParserRun()
        }
        return true
      }
      return false
    }

    function initParserRun() {
      GParserRunning = true
      if (!GParserWaitForCount && !GParserNewCount) {
        console.time('process-meta')
      }
      if (GParserNewCount) {
        --GParserNewCount
      }
    }

    function parseNewScopes() {
      var element = GParserQueue.shift()
      while (element) {
        element.$sQueued = false
        parseScope(element)
        element = GParserQueue.shift()
      }
    }

    function parserEndgame() {
      GParserRunning = false
      if (GParserWaitForCount || GParserNewCount) {
        console.debug('Setu.parser _', GParserQueue.length, 'waiting',
          GParserWaitForCount, 'new', GParserNewCount)
        return
      }
      console.debug('Setu.parser $', GParserQueue.length, 'waiting',
        GParserWaitForCount, 'new', GParserNewCount)
      console.timeEnd('process-meta')
    }

    function postParserRun() {
      if (!GPostMetaDone) {
        GPostMetaDone = true
        setupLinksPostParserRun()
        fireEvent(ns.EVENT_PAGE_RENDER, ns)
      }
    }

    function unhideElementsInvolvingResource(key) {
      console.debug('Setu.parser @ unhide', key, GHidden)
      var re = new RegExp("[^a-zA-Z0-9_]" + key + "[^a-zA-Z0-9_]", ''),
        elements = [],
        hidden = []
      GHidden.forEach(function(position) {
        if (position.data && position.data.match(re)) {
          elements.push(showHiddenSetuScope(position))
        } else {
          hidden.push(position)
        }
      })
      GHidden = hidden
      console.debug('Setu.parser $ unhide', key, GHidden, elements)
      return elements
    }

    function parseScope(element) {
      if (shouldNotParseScope(element)) {
        return
      }
      console.group()
      console.debug('Setu.parser @ eval', element)
      var children = maskScopeChildrenFromParsing(element)
      var setu = setupSetuForParsing(element)
      if (PARSE_DONE === (children = doParseScope(element, setu, children))) {
        console.groupEnd()
        return
      }
      setupSetu(element)
      setupScopeChildrenForParsing(element, setu, children)
      postParseScope(element)
      console.debug('Setu.parser $ eval', element, setu)
      console.groupEnd()
    }

    function shouldNotParseScope(element) {
      // First things first, if your parent got removed, stop right here
      if (null === element.parentNode) {
        console.debug('Setu.parser $ eval dead', element)
        return true
      }
      // Do nothing if a parent is being eval'd right now. This happens
      // if observer reports both parent and children
      if (element.$sEvalingParent) {
        console.debug('Setu.parser $ eval ignore', element)
        return true
      }
      return false
    }

    function maskScopeChildrenFromParsing(element) {
      // First disable processing of any children that may have been
      // reported as added by observer
      var children = Array.prototype.slice.call(
        element.querySelectorAll(META_ATTRS_SELECTOR))
      children.forEach(function(child) {
        child.$sEvalingParent = true
      })
      return children
    }

    function setupSetuForParsing(element) {
      var setu = element.$s = element.$s || {}
      setu.needed = setu.needed || {}
      return setu
    }

    /* eslint-disable complexity */
    function doParseScope(element, setu, children) {
      if (PARSE_DONE === parseMetaInclude(element) ||
        PARSE_DONE === parseMetaRequire(element, setu) ||
        PARSE_DONE === parseMetaBind(element, setu) ||
        PARSE_DONE === parseMetaLoop(element, setu, children) ||
        PARSE_DONE === parseMetaIf(element, setu) ||
        PARSE_DONE === parseMetaDeclare(element, setu)) {
        return PARSE_DONE
      }
      if (element.outerHTML.match(REGEX_TEMPLATE)) {
        children = parseScopeTemplate(element, setu, children)
      }
      return children
    }
    /* eslint-enable complexity */

    function parseMetaInclude(element) {
      if (!element.hasAttribute(META_INCLUDE)) {
        return PARSE_FALL_THROUGH
      }
      // Process the include meta attrib by fetching the corresponding
      // HTML and adding to DOM by replacing this element if it has
      // replace set or replacing the inner html of the element with it
      console.debug('Setu.parser @ _', META_INCLUDE, element)
      console.time(META_INCLUDE)
      GParserWaitForCount++
      GET(element.getAttribute(META_INCLUDE), {}, function(response) {
        console.group()
        console.debug('Setu.parser > @', META_INCLUDE, element)
        GParserWaitForCount--
        if (element.hasAttribute(META_REPLACE)) {
          element = parseMetaReplace(element, response)
          console.timeEnd(META_INCLUDE)
          console.groupEnd()
        } else {
          processMetaIncludeHtmlData(element, response)
          console.timeEnd(META_INCLUDE)
          console.groupEnd()
          reparseElementIfWithMeta(element)
        }
      })
      return PARSE_DONE
    }

    function parseMetaReplace(element, response) {
      element = overwriteMetaScope(element,
        response.data.match(REGEX_TEMPLATE) ?
        evalTemplate(element.$s.needed, response.data) :
        response.data)
      console.debug('Setu.parser $', META_INCLUDE, element)
      return element
    }

    function processMetaIncludeHtmlData(element, response) {
      element.innerHTML = response.data.match(REGEX_TEMPLATE) ?
        evalTemplate(element.$s.needed, response.data) :
        response.data
      element.removeAttribute(META_INCLUDE)
      console.debug('Setu.parser $', META_INCLUDE, element)
    }

    function reparseElementIfWithMeta(element) {
      if (containsMeta(element)) {
        requeueAndParse(element)
      }
    }

    function requeueAndParse(element) {
      // This element has to be given another chance
      GParserQueue.push(element)
      element.$sQueued = true
      // Show the intent by calling this explicitly
      // If parser is still running it would eventually
      // get it from the queue, or it would pick it in
      // a fresh run starting here
      runParser()
    }

    function parseMetaRequire(element, setu) {
      if (!element.hasAttribute(META_REQUIRE) || setu.gotRequired) {
        return PARSE_FALL_THROUGH
      }
      // Process the require meta attrib by looking at what resources
      // this element requires and in case some or all of them are not
      // available, make the calls to get them and then process this
      // element again
      console.debug('Setu.parser @', META_REQUIRE, element, setu)
      console.time(META_REQUIRE)
      var required = parseMetaRequireSpec(element),
        resources
      if (!(resources = resourcesIfAllExist(required))) {
        parseMetaRequireFetch(element, setu, required)
        return PARSE_DONE
      }
      copyRequiredToSetu(setu, resources)
      console.time(META_REQUIRE)
      console.debug('Setu.parser $', META_REQUIRE, element, setu)
      return PARSE_FALL_THROUGH
    }

    function parseMetaRequireFetch(element, setu, required) {
      console.group()
      console.debug('Setu.parser @ _', META_REQUIRE, element, setu)
      GParserWaitForCount++
      getResources(required, {}, function(resources) {
        console.debug('Setu.parser > @', META_REQUIRE, element,
          setu)
        copyRequiredToSetu(setu, resources)
        GParserWaitForCount--
        console.time(META_REQUIRE)
        console.debug('Setu.parser $', META_REQUIRE, element, setu)
        console.groupEnd()
        requeueAndParse(element)
      })
    }

    function copyRequiredToSetu(setu, resources) {
      for (var title in resources) {
        if (resources.hasOwnProperty(title)) {
          setu.needed[title] = resources[title]
        }
      }
      setu.gotRequired = true
    }

    function parseMetaBind(element, setu) {
      if (!element.hasAttribute(META_BIND) || setu.template) {
        return PARSE_FALL_THROUGH
      }
      // If an element has bind set then the first things before moving
      // forward is to remember the template so we can use it later when
      // we process bindings for this element
      console.debug('Setu.parser @', META_BIND, element, setu)
      console.time(META_BIND)
      if (element.hasAttribute(META_LOOP)) {
        var loop = element.getAttribute(META_LOOP)
        element.removeAttribute(META_LOOP)
        setu.template = element.outerHTML
        element.setAttribute(META_LOOP, loop)
      } else {
        setu.template = element.outerHTML
      }
      console.timeEnd(META_BIND)
      console.debug('Setu.parser $', META_BIND, element, setu)
      return PARSE_FALL_THROUGH
    }

    function parseMetaLoop(element, setu, children) {
      var match
      if (!element.hasAttribute(META_LOOP) ||
        (null === (match = element.getAttribute(META_LOOP).match(
          REGEX_LOOP)))) {
        return PARSE_FALL_THROUGH
      }
      // Process loop meta attribute. It's simple. Evaluate the loop expr.
      // Make copy of this element's HTML template parsed using required/set
      // globals per loop container element. The element is also part of
      // the HTML template parsing as well
      console.debug('Setu.parser @', META_LOOP, element, setu)
      console.time(META_LOOP)
      var key = match[1],
        array = match[2]
      try {
        array = evalExpr(setu.needed, array)
      } catch (e) {
        consoleError('Setu.parser !', META_LOOP, match[2], element, setu,
          e.message, e.stack)
        console.timeEnd(META_LOOP)
        return PARSE_DONE
      }
      element.$s.contextKey = key
      array.forEach(function(iterator) {
        var iteration = createLoopIterationElement(element, iterator)
        console.debug('Setu.parser >', META_LOOP, element, key,
          iterator, iteration)
      })
      if (array.length && containsMeta($_(element).previous().element)) {
        GParserNewCount = 1
      }
      removeDanglingScopes(children)
      removeMetaScope(element)
      console.timeEnd(META_LOOP)
      console.debug('Setu.parser $', META_LOOP, element, setu)
      return PARSE_DONE
    }

    function parseMetaIf(element, setu) {
      if (!element.hasAttribute(META_IF)) {
        return PARSE_FALL_THROUGH
      }
      // Process if attribute. It's simple. Parse the expression. If the
      // result is false, hide this element. An if element can wake up
      // time and again, so every time we hide it, we also have to clean
      // up the state of its children
      console.debug('Setu.parser @', META_IF, element, setu)
      console.time(META_IF)
      var expr = element.getAttribute(META_IF),
        condition = false
      try {
        condition = evalExpr(setu.needed, expr)
      } catch (e) {
        consoleError('Setu.parser !', META_IF, expr, element, e.message,
          e.stack)
        console.timeEnd(META_IF)
        return PARSE_DONE
      }
      if (!condition) {
        GHidden.push(hideSetuScope(element))
        console.timeEnd(META_IF)
        return PARSE_DONE
      }
      console.timeEnd(META_IF)
      console.debug('Setu.parser $', META_IF, element, setu)
      return PARSE_FALL_THROUGH
    }

    function parseMetaDeclare(element, setu) {
      var match
      if (!element.hasAttribute(META_DECLARE) ||
        (null === (match = element.getAttribute(META_DECLARE).match(
          REGEX_DECLARE)))) {
        return PARSE_FALL_THROUGH
      }
      console.debug('Setu.parser @', META_DECLARE, element, setu)
      console.time(META_DECLARE)
      var name = match[1],
        rval = match[2]
      try {
        rval = evalExpr(setu.needed, rval)
      } catch (e) {
        consoleError('Setu.parser !', META_DECLARE, match[2], element, e.message,
          e.stack)
        console.timeEnd(META_DECLARE)
        return PARSE_DONE
      }
      setu.needed[name] = rval
      console.timeEnd(META_DECLARE)
      console.debug('Setu.parser $', META_DECLARE, element, setu)
      return PARSE_FALL_THROUGH
    }

    function parseScopeTemplate(element, setu, children) {
      console.debug('Setu.parser @ {{}}', element, setu)
      console.time('{{}}')
      addEvalVars(setu.needed)
      if (element.innerHTML.match(REGEX_TEMPLATE)) {
        // Any element being processed with or without meta attributes,
        // needs its templates to be processed. This is done right away
        // in case this is not a loop or if templates. In those cases,
        // it's a waste, as a loop template is going to be evaluated and
        // copied into multiple non-loop elements and each copy's template
        // is evaluated right then. Also for if element, in case they are
        // going to be hidden post condition parsing, it's a waste of a
        // template processing cycle at this point. Also, we wait for
        // any declares to be processed that may help resolving any parts
        // of the html
        stopMonitoringAdditions()
        element.innerHTML = evalTemplate({}, element.innerHTML)
        removeDanglingScopes(children)
        monitorAdditions()
        children = Array.prototype.slice.call(
          element.querySelectorAll(META_ATTRS_SELECTOR))
      }
      for (var idx = 0; idx < element.attributes.length; ++idx) {
        var attr = element.attributes[idx]
        if (attr.value.match(REGEX_TEMPLATE)) {
          attr.value = evalTemplate({}, attr.value)
        }
      }
      unsetEvalVar(Object.keys(setu.needed))
      console.timeEnd('{{}}')
      console.debug('Setu.parser $ {{}}', element, setu)
      return children
    }

    function setupScopeChildrenForParsing(element, setu, children) {
      children.forEach(function(child) {
        setupChildSetu(element, child)
        if (!child.$sQueued) {
          GParserQueue.push(child)
          child.$sQueued = true
        }
      })
      if (children.length) {
        setu.children = children
      }
    }

    function postParseScope(element) {
      if (element.hasAttribute(META_CLICK)) {
        setupClickAction(element)
      }
      if ('form' === element.tagName.toLowerCase()) {
        setupForm(element)
      }
      if (element.hasAttribute(META_BIND)) {
        setupBinds(element)
      }
    }

    /* TODO in bind case this is needed and see how it changes with new design around needs
      parseMetaBindSpec(scope.element).forEach(function(resource, idx) {
        required[idx] = resource.key
      })
      var ancestor = scope
      while(ancestor && !ancestor.element.hasAttribute(META_REQUIRE)) {
        ancestor = ancestor.parent
      }
      if(ancestor) {
        parseMetaRequireSpec(ancestor.element).forEach(function(resource) {
          required.push(resource.key)
        })
      }
    */

    var GBinds = {},
      GBindsQueue = [],
      GProcessingBind = false

    registerEvent(ns.EVENT_LIST_RESOURCE_CREATE, processBindsOnListCreate)

    function resetBinds() {
      GBinds = {}
      GBindsQueue = []
      GProcessingBind = false
      console.debug('Setu.binds x all')
    }

    function setupBinds(element) {
      if (element.$sBind) { // already setup element's bind
        return true
      }
      var setu = ensureSetuForBind(element)
      console.debug('Setu.binds @ +', element, setu, GBinds)
      setupBindsWithTargets(element, setu, parseMetaBindSpec(element))
      registerEventFrom(ns.EVENT_BEFORE_ELEMENT_DELETE, setu.key,
        clearBindsBeforeElementDelete, ns)
      element.$sBind = true
      console.debug('Setu.binds $ +', element, setu, GBinds)
    }

    function ensureSetuForBind(element) {
      var setu = element.$s
      if (!setu) {
        consoleError('Setu.binds', 'internal programming error with binds',
          element)
        return
      }
      return setu
    }

    function setupBindsWithTargets(element, setu, bindsList) {
      bindsList.forEach(function(bindResource) {
        var bindTarget = bindResource.key,
          bindWith = setu.key
        GBinds[bindTarget] = GBinds[bindTarget] || {}
        if (!GBinds[bindTarget][bindWith]) {
          var newBind = (0 === Object.keys(GBinds[bindTarget]).length)
          GBinds[bindTarget][bindWith] = element
          if (newBind) {
            registerNewBindTarget(bindTarget, bindResource)
          }
          console.debug('Setu.binds +', bindTarget, setu)
        }
      })
    }

    function registerNewBindTarget(bindTarget, bindResource) {
      if (KW_DETAIL === bindResource.type) {
        registerEventFrom(ns.EVENT_DETAIL_RESOURCE_CHANGE, bindTarget,
          processBindsOnDetailChange, ns)
      } else if (KW_LIST === bindResource.type) {
        registerEventFrom(ns.EVENT_LIST_RESOURCE_CHANGE, bindTarget,
          processBindsOnListChange, ns)
      }
    }

    function clearBindsBeforeElementDelete(ignored, element) {
      var setu = element.$s
      console.debug('Setu.binds @ x', element, setu, GBinds)
      var bindsList = parseMetaBindSpec(element)
      bindsList.forEach(function(bindResource) {
        var bindTarget = bindResource.key,
          bindWith = setu.key
        if (GBinds[bindTarget][bindWith]) {
          delete GBinds[bindTarget][bindWith]
          unregisterBindTargetIfDetached(bindTarget, bindResource)
          console.debug('Setu.binds x', bindTarget, element)
        }
      })
      unregisterEventFrom(ns.EVENT_BEFORE_ELEMENT_DELETE, setu.key, ns)
      console.debug('Setu.binds $ x', element, setu, GBinds)
    }

    function unregisterBindTargetIfDetached(bindTarget, bindResource) {
      if (0 === Object.keys(GBinds[bindTarget]).length) {
        if (KW_DETAIL === bindResource.type) {
          unregisterEventFrom(ns.EVENT_DETAIL_RESOURCE_CHANGE, bindTarget, ns)
        } else
        if (KW_LIST === bindResource.type) {
          unregisterEventFrom(ns.EVENT_LIST_RESOURCE_CHANGE, bindTarget, ns)
        }
      }
    }

    function processBindsOnDetailChange(ignored, resource, data) {
      console.debug('Setu.binds @ detail-change', resource, data)
      if (handleBindProcQueueing(processBindsOnDetailChange, ignored, resource, data)) {
        /* Another bind is being processed right now, we got queued */
        return
      }
      var bindTarget = data.key,
        field = data.field
      if (!GBinds[bindTarget]) {
        /* No bound elements to this target, end processing */
        console.debug('Setu.binds $ detail-change', resource, data)
        bindProcessingEndgame()
        return
      }
      var toChange = findBoundOnesEffectedByFieldChange(bindTarget, field)
      if (!toChange.length) {
        console.debug('Setu.binds $ detail-change no updates needed', data)
        bindProcessingEndgame()
        return
      }
      reEvalBoundElements(bindTarget, toChange)
      bindProcessingEndgame()
      console.debug('Setu.binds $ detail-change', resource, data)
    }

    function findBoundOnesEffectedByFieldChange(bindTarget, field) {
      var bindWithList = Object.keys(GBinds[bindTarget]).slice()
      var toChange = []
      bindWithList.forEach(function(bindWith) {
        var element = GBinds[bindTarget][bindWith]
        var re = new RegExp("\\." + field + "[^a-zA-Z0-9_]", 'g')
        console.debug('Setu.binds', element.$s.key, element.$s.template, re)
        if (element.$s.template.match(re)) {
          toChange.push(bindWith)
        }
      })
      return toChange
    }

    function processBindsOnListCreate(ignored, resource) {
      console.debug('Setu.binds @ list-create', resource)
      var bindTarget = resource.key
      var bindWithList = GBinds[bindTarget] ? Object.keys(GBinds[bindTarget]).slice() : []
      if (!bindWithList.length) {
        unhideElementsInvolvingResource(resource.title || getGenericResourceTitle(resource))
        console.debug('Setu.binds $ list-create did unhide as nothing was bound',
          resource)
      } else {
        reEvalBoundElements(bindTarget, bindWithList)
        console.debug('Setu.binds $ list-create', resource, data)
      }
    }

    function processBindsOnListChange(ignored, resource) {
      console.debug('Setu.binds @ list-change', resource)
      var bindTarget = resource.key
      if (!GBinds[bindTarget]) {
        return
      }
      var bindWithList = Object.keys(GBinds[bindTarget]).slice()
      reEvalBoundElements(bindTarget, bindWithList)
      console.debug('Setu.binds $ list-change', resource)
    }

    function reEvalBoundElements(bindTarget, bindWithList) {
      bindWithList.forEach(function(bindWith) {
        var element = GBinds[bindTarget][bindWith]
        createBindScopeSibling(element)
        removeMetaScope(element)
      })
    }

    function handleBindProcQueueing(called, ignored, resource, data) {
      if (!GProcessingBind) {
        GProcessingBind = true
        console.group()
        return false
      } else {
        GBindsQueue.push([called, ignored, resource, data])
        console.debug('Setu.binds Q', called, ignored, resource, data)
        return true
      }
    }

    function bindProcessingEndgame() {
      GProcessingBind = false
      console.groupEnd()
      var details = GBindsQueue.shift()
      if (details) {
        details[0](details[1], details[2], details[3])
      }
    }

    var GClicks

    function setupClicks(clicks) {
      GClicks = clicks
    }

    function setupClickAction(element) {
      if (element.$sClick) { // already setup
        return
      }
      var clickDetail = parseMetaClick(element)
      if (null === clickDetail) {
        consoleError('Setu.clicks ! invalid setu-click',
          element.getAttribute(META_CLICK), element)
        throw new Error(MSG_INVALID_META)
      }
      setupClickActionByType(clickDetail, element)
      element.$sClick = true
    }


    function setupClickActionByType(clickDetail, element) {
      switch (clickDetail.type) {
        case KW_DETAIL:
        case KW_UPDATE:
        case KW_DELETE:
          setupInstanceClickAction(element, clickDetail)
          console.debug('Setu.clicks + click handler', clickDetail.type, element)
          break
        case KW_CREATE:
        case KW_LIST:
          setupModelClickAction(element, clickDetail)
          console.debug('Setu.clicks + click handler', clickDetail.type, element)
          break
        case 'generic':
          element.onclick = function(e) {
            shuntEvent(e)
            /* eslint-disable no-eval */
            eval(clickDetail.code)
            /* eslint-enable no-eval */
          }
          break
      }
    }

    function setupInstanceClickAction(element, clickDetail) {
      var setu = element.$s
      if (!setu) {
        consoleError(
          'Setu.clicks ! internal programming error blocked processing setu-click',
          element)
        return
      }
      var context = ensureContextForClickableInstance(setu, element),
        modelName = context.$$m.name
      switch (clickDetail.type) {
        case KW_DETAIL:
        case KW_UPDATE:
          if (GClicks[modelName] && GClicks[modelName][clickDetail.type]) {
            var userFn = setupClickActionUserFn(element, modelName, clickDetail)
            clickDetail.instance = context
            setupClickActionHandler(element, clickDetail, userFn)
          }
          break
        case KW_DELETE:
          setupClickActionHandler(element, context, deleteInstance)
          break
      }
    }

    function ensureContextForClickableInstance(setu, element) {
      var context = setu.needed[setu.contextKey]
      if (!context) {
        consoleError(
          'Setu.clicks ! setu-click specified on an element for',
          'which no instance context can be found',
          element)
        throw new Error(MSG_INVALID_META)
      }
      return context
    }

    function setupModelClickAction(element, clickDetail) {
      var modelName = clickDetail.modelName
      if (GClicks[modelName] && GClicks[modelName][clickDetail.type]) {
        var userFn = setupClickActionUserFn(element, modelName, clickDetail)
        setupClickActionHandler(element, clickDetail, userFn)
      }
    }

    function setupClickActionUserFn(element, modelName, clickDetail) {
      var userFn = GClicks[modelName][clickDetail.type]
      if ('function' !== typeof(userFn)) {
        consoleError('Setu.clicks ! not a view function', modelName, clickDetail.type,
          userFn)
        throw new Error(MSG_BADLY_CONFIGURED)
      }
      clickDetail.passed = element.getAttribute(META_PASS)
      clickDetail.origin = element
      return userFn
    }

    function setupClickActionHandler(element, cookie, userFn) {
      $_(element).onclick(function(e) {
        shuntEvent(e)
        userFn(cookie)
      })
    }

    function setupForm(form) {
      if (null === form.parentNode || form.$sForm) {
        return
      }
      registerEvent(ns.EVENT_META_RENDER, processFormOnMetaRender, form)
    }

    function processFormOnMetaRender(form) {
      unregisterEvent(ns.EVENT_META_RENDER, form)
      fixupSelectControls(form)
      var parsed = parseMetaFormModelOrInstance(form)
      if (!parsed) {
        return
      }
      switch (parsed.type) {
        case KW_MODEL:
          setupFormEndgame(form, createModelInstance(parsed.model))
          break
        case KW_INSTANCE:
          var resources
          if ((resources = resourcesIfAllExist([parsed.resource]))) {
            setupFormEndgame(form, resources[Object.keys(resources)[0]])
          } else {
            getResources([parsed.resource], {}, function(resources) {
              setupFormEndgame(form, resources[Object.keys(resources)[0]])
            })
          }
          break
      }
    }

    function fixupSelectControls(form) {
      form.querySelectorAll('select').forEach(function(select) {
        var option = select.querySelector('option[selected]')
        if (option) {
          select.value = option.value
        }
      })
    }

    function setupFormEndgame(form, instance) {
      form.$si = instance
      form.onsubmit = formOnSubmit(form)
      form.$sForm = true
      console.debug('Setu.forms $ form', form, form.$si)
    }

    function formOnSubmit(form) {
      return function() {
        if (form.hasAttribute(FORM_RELATED_TO)) {
          return false
        }
        try {
          /* Validate the form and any of its related forms */
          var relatedForms = getRelatedForms(form)
          if (!validateFormAndRelated(form, relatedForms)) {
            return false
          }
          /* Populate form's instance with form data */
          formToInstance(form)
          /* Copy instances of related forms into this form */
          copyRelatedForms(form, relatedForms)
          /* Copy any query params */
          copyQueryParams(form)
          /* Save (create/update) instance now */
          saveInstance(form.$si, function(instance) {
            console.log('Setu.forms $ form-submit', form, instance)
            resetModelFormAndRelated(form, relatedForms)
            fireEvent(ns.EVENT_FORM_SUCCESS, form, instance)
          }, function(empty) {
            resetModelFormAndRelated(form, relatedForms)
            consoleError('Setu.forms ! form-submit', form)
          })
          return false
        } catch (e) {
          consoleInfo('Setu.forms form-submit', e.message, e.stack)
          return false
        }
      }
    }

    function validateFormAndRelated(form, relatedForms) {
      return validateForm(form) && validateRelatedForms(relatedForms)
    }

    function validateForm(form) {
      return -1 === runAdapters(ns.ADAPTER_VALIDATE_FORM, form).indexOf(false)
    }

    function getRelatedForms(form) {
      return document.querySelectorAll(
        'form[foreign-key="' + form.getAttribute('name') + '"]')
    }

    function validateRelatedForms(relatedForms) {
      var idx
      for (idx = 0; idx < relatedForms.length; ++idx) {
        if (!validateForm(relatedForms[idx])) {
          return false
        }
      }
      return true
    }

    var ATTR_NAME = 'name'

    function formToInstance(form) {
      /**
       * Run through all form control elements and copy those
       * matching to fields of the form's setu instance. Copying
       * needs 2 stages:
       * 1. Convert the form's string-only values to appropriate
       *    types as per the instance's model specification
       * 2. Copy the set of adapted field values through the
       *    validate and copy data function
       */
      var elements = form.elements,
        data = {},
        model = form.$si.$$m
      for (var idx = 0; idx < elements.length; ++idx) {
        var element = elements[idx],
          field = element.getAttribute(ATTR_NAME)
        if (field && field in model.def) {
          data[field] = adaptFormElementToFieldType(
            model.name, field, model.def[field], element.value)
        }
      }
      validateInstanceDataFields(model.name, model.def, data, form.$si)
      runAdapters(ns.ADAPTER_TUNE_INSTANCE, form, form.$si)
    }

    var MODEL_DEF_STR_TYPES = [
      MODEL_DEF_TYPE_STRING,
      MODEL_DEF_TYPE_DATETIME,
      MODEL_DEF_TYPE_DATE,
      MODEL_DEF_TYPE_TIME,
      MODEL_DEF_TYPE_UUID
    ]

    function adaptFormElementToFieldType(modelName, field, fieldDef, value) {
      var fieldType = getModelFieldType(modelName, field, fieldDef)
      switch (fieldType) {
        case MODEL_FIELD_TYPE_PRIMITIVE:
        case MODEL_FIELD_TYPE_PK:
          return evalIfNotAStringType(fieldDef.type, value)
        case MODEL_FIELD_TYPE_FK:
          var related = getModel(fieldDef.fk),
            relatedPk = related.primaryKeys[0]
          return adaptFormElementToFieldType(related.name,
            relatedPk, related.def[relatedPk], value)
        case MODEL_FIELD_TYPE_ARRAY:
          return eval(value)
      }
    }

    function evalIfNotAStringType(type, value) {
      return -1 === MODEL_DEF_STR_TYPES.indexOf(type) ? eval(value) : value
    }

    function copyRelatedForms(form, relatedForms) {
      /* Reset earlier copies of related form's instances */
      if (relatedForms.length) {
        resetRelatedAsField(form,
          relatedForms[0].getAttribute(FORM_RELATED_AS))
      }
      for (var idx = 0; idx < relatedForms.length; ++idx) {
        var relatedForm = relatedForms[idx]
        formToInstance(relatedForm)
        copyRelatedFormToInstance(relatedForm, form)
      }
    }

    function resetRelatedAsField(form, relatedAs) {
      var model = form.$si.$$m,
        fieldDef = model.def[relatedAs],
        instance = form.$si
      instance[relatedAs] =
        isArrayOfFks(model.name, relatedAs, fieldDef) ? [] :
        undefined
    }

    function isArrayOfFks(modelName, field, fieldDef) {
      var fieldType = getModelFieldType(modelName, relatedAs, fieldDef)
      if (MODEL_FIELD_TYPE_ARRAY === fieldType) {
        var arrFieldType = getModelArrayFieldType(
          modelName, relatedAs, fieldDef.elements)
        return MODEL_FIELD_TYPE_FK == arrFieldType
      }
      return false
    }

    function copyRelatedFormToInstance(relatedForm, form) {
      var relatedAs = relatedForm.getAttribute(FORM_RELATED_AS),
        relatedInstance = relatedForm.$si,
        instance = form.$si
      if (isArray(instance[relatedAs])) {
        instance[relatedAs].push(relatedInstance)
      } else {
        instance[relatedAs] = relatedInstance
      }
    }

    function copyQueryParams(form) {
      if (form.hasAttribute(META_PARAMS)) {
        form.$si.$$qp = form.getAttribute(META_PARAMS)
      }
    }

    function resetModelFormAndRelated(form, relatedForms) {
      if (form.hasAttribute(META_MODEL)) {
        // need to create a new instance now
        recreateFormInstance(form)
        // reset related forms
        for (var idx = 0; idx < relatedForms.length; ++idx) {
          var relatedForm = relatedForms[idx]
          if (relatedForm.hasAttribute(META_MODEL)) {
            recreateFormInstance(relatedForm)
          }
        }
      }
    }

    function recreateFormInstance(form) {
      form.$si = createModelInstance(form.$si.$$m)
    }

    function setupLinksPostParserRun() {
      console.debug('Setu.links @')
      console.time('links-process')
      GAppElement.querySelectorAll('a[href]').forEach(function(link) {
        if (link.$sLink) { // already setup
          return true
        }
        var path = link.getAttribute('href').replace(/\?.*$/, '')
        if (GRoutes[path]) {
          $_(link).onclick(function(e) {
            shuntEvent(e)
            console.debug('Setu.application navigating in-browser', link.getAttribute(
              'href'))
            loadUrl(link.getAttribute('href'))
            return false
          })
          console.debug('Setu.links $ link', link)
        }
        link.$sLink = true
      })
      console.timeEnd('links-process')
      console.debug('Setu.links $ process')
    }

    var MutationObserver = window.MutationObserver ||
      window.WebKitMutationObserver ||
      window.MozMutationObserver

    if (!MutationObserver) {
      consoleError('Setu.observer ! no MutationObserver support in browser')
      throw new Error(MSG_NO_SUPPORT)
    }

    var GObserver = new MutationObserver(function(mutations) {
      processAddedNodes(mutations)
    })

    function monitorAdditions() {
      if (GAppElement && GAppElement.parentNode) {
        GObserver.observe(GAppElement, {
          childList: true,
          subtree: true
        })
      }
    }

    function stopMonitoringAdditions() {
      GObserver.disconnect()
    }

    function processAddedNodes(mutations) {
      var gotNew = false
      mutations.forEach(function(m) {
        if (m.addedNodes && m.addedNodes.length) {
          for (var idx = 0; idx < m.addedNodes.length; ++idx) {
            var node = m.addedNodes[idx]
            if (NODE_TYPE_ELEMENT === node.nodeType && containsMeta(node)) {
              GParserQueue.push(node)
              node.$sQueued = true
              gotNew = true
              console.debug('Setu.observer +', node)
            }
          }
        }
      })
      if (!GParserRunning && gotNew) {
        runParser()
      }
    }

    var GRoutes,
      GGurrentRoute,
      GPath

    function setupRoutes(routes) {
      GRoutes = routes
      resetRoutes()
    }

    function resolveRoute(successFn) {
      figureOutPath()
      if (unconfiguredPath()) {
        successFn()
        return
      }
      handleRouteDef(GRoutes[GPath], successFn)
    }

    function resetRoutes() {
      GGurrentRoute = GPath = undefined
      console.debug('Setu.routes x all')
    }

    function figureOutPath() {
      if (GHistoryChange && GHistoryChange.path) {
        GPath = GHistoryChange.path.replace(/\?.*$/, '')
        GHistoryChange = null
        console.debug('Setu.routes popstate', GPath)
      } else {
        GPath = location.pathname
        console.debug('Setu.routes location', GPath)
      }
    }

    function unconfiguredPath() {
      if (!GRoutes[GPath]) {
        /*consoleError('Setu.routes ! no definition for', GPath)
        throw new Error(MSG_BADLY_CONFIGURED)*/
        GGurrentRoute = {}
        return true
      }
      return false
    }

    function handleRouteDef(routeDef, successFn) {
      if ('function' === typeof(routeDef)) {
        routeDef(function(ret) {
          finishRouteResolve(ret, successFn)
        })
      } else {
        finishRouteResolve(routeDef, successFn)
      }
    }

    function finishRouteResolve(routeDef, successFn) {
      GGurrentRoute = routeDef
      console.debug('Setu.routes $ resolve', GPath, GGurrentRoute)
      successFn()
    }

    if (!window.history ||
      'function' === typeof(!window.history.pushState) ||
      'function' === typeof(!window.history.popState)) {
      consoleError('Setu.history ! no support for browsing history update')
      throw new Error(MSG_NO_SUPPORT)
    }

    var GHistoryChange

    window.history.pushState({
        path: location.pathname + location.search
      },
      '',
      location.pathname + location.search)

    window.onpopstate = function(event) {
      if (event.state && event.state.path) {
        GHistoryChange = event.state
        navigate()
      }
    }

    function pushHistory(path) {
      window.history.pushState({
        path: path
      }, '', path)
    }

    function replaceHistory(path) {
      window.history.replaceState({
        path: path
      }, '', path)
    }

    if ('function' !== typeof(document.querySelector)) {
      consoleError('Setu.application ! document.querySelector not supported')
      throw new Error(MSG_NO_SUPPORT)
    }

    var GAppElement = document.querySelector('[setu-app]'),
      GAppEnd,
      GAppName

    if (!GAppElement) {
      consoleError('Setu.application',
        'no element with setu-app attribute defined')
      throw new TypeError(MSG_BADLY_CONFIGURED)
    }

    if ('function' !== typeof(GAppElement.querySelectorAll)) {
      consoleError('Setu.application ! HtmlElement.querySelectorAll not supported')
      throw new Error(MSG_NO_SUPPORT)
    }

    function runApp(name, settings) {
      console.debug('Setu.application running...')
      GAppName = name
      setupConfig(settings.config || {})
      setupRoutes(settings.routes || {})
      setupModels(settings.models, settings.modelFilters,
        settings.config && settings.config.models)
      setupResources(settings.resources || {})
      setupClicks(settings.views || {})
      navigate()
    }

    function reloadApp() {
      console.debug('Setu.application refreshing...')
      flushApp()
      navigate()
    }

    function loadUrl(url) {
      console.debug('Setu.application opening', url)
      pushHistory(url)
      navigate()
    }

    function redirectTo(url) {
      console.debug('Setu.application redirecting (in-browser) to', url)
      replaceHistory(url)
      navigate()
    }

    function navigate() {
      console.time('navigate')
      clearApp()
      execApp()
      console.timeEnd('navigate')
    }

    function clearApp() {
      console.time('app-clear')
      var toFlush = flushOnPathChangeConfig()
      if ('resources' in toFlush) {
        toFlush.resources.forEach(flushResource)
      }
      resetRoutes()
      resetParser()
      resetBinds()
      resetEvals()
      resetAppEnd()
      console.debug('Setu.application x')
      console.timeEnd('app-clear')
    }

    function resetAppEnd() {
      if (GAppEnd) {
        var last = GAppEnd.previous()
        while (last) {
          var curr = last
          last = last.previous()
          curr.remove()
        }
        GAppEnd = undefined
      }
    }

    function execApp() {
      console.time('resolve-n-execute')
      resolveRoute(function() {
        if (GGurrentRoute.redirect) {
          redirectTo(GGurrentRoute.redirect)
          console.timeEnd('resolve-n-execute')
        } else if (GGurrentRoute.include) {
          processRouteInclude()
        } else {
          processLoadedAndWait()
        }
      })
    }

    function processRouteInclude() {
      console.debug('Setu.application page rendering needs',
        GGurrentRoute.include)
      setEvalVar('queryparams', extractQueryParams())
      if (GGurrentRoute.flush) {
        flushApp()
      }
      var required = GGurrentRoute.require || []
      getResources(required, {}, function(values) {
        addEvalVars(values)
        monitorAdditions()
        loadAppHtml()
        console.timeEnd('resolve-n-execute')
      })
    }

    function extractQueryParams() {
      var queryparams = {}
      if (window.location.search) {
        var querystring = window.location.search.replace(/^\?/, '')
        var params = querystring.split('&')
        params.forEach(function(param) {
          var pair = param.split('=')
          queryparams[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
        })
      }
      return queryparams
    }

    function loadAppHtml() {
      GET(GGurrentRoute.include, {}, function(response) {
        GAppEnd = $_(GAppElement).firstChild()
        if (GAppEnd) {
          GAppEnd.before(response.data)
        } else {
          $_(GAppElement).append(response.data)
        }
        if (!GAppElement.querySelectorAll(META_ATTRS_SELECTOR).length) {
          postParserRun()
        }
      })
    }

    function flushApp() {
      flushAllResources()
      console.debug('Setu.application flushed all resources')
    }

    function processLoadedAndWait() {
      monitorAdditions()
      GAppElement.querySelectorAll(META_ATTRS_SELECTOR).forEach(
        function(element) {
          GParserQueue.push(element)
          element.$sQueued = true
        })
      runParser()
      console.timeEnd('resolve-n-execute')
    }

    ns.run = runApp
    ns.refresh = reloadApp
    ns.open = loadUrl
    ns.clear = resetParser
    ns.app = GAppElement

  }(window.Setu = window.Setu || {}))

$_.ready(function() {
  Setu.adapters['Django'] = [{
    purpose: Setu.ADAPTER_AJAX_BEFORE_SEND,
    handler: function(ignore, xhr, options, context) {
      if (!/^(GET|HEAD|OPTIONS|TRACE)$/.test(options.method) && !
        context.crossDomain) {
        var csrfToken = document.cookie.match(new RegExp(
          'csrftoken=([^;]+)'));
        if (csrfToken) {
          xhr.setRequestHeader('X-CSRFToken', csrfToken[1])
          console.debug('DjangoAdapter', 'added X-CSRFToken header',
            csrfToken[1])
        }
      }
    }
  }]
})

$_.ready(function() {
  Setu.adapters['DjangoRestFramework'] = [{
    purpose: Setu.ADAPTER_MODELS_LIST,
    handler: function(ignore, response) {
      function isArray(v) {
        return ('[object Array]' === Object.prototype.toString.call(v))
      }

      function isObject(v) {
        return ('object' === typeof(v) && !isArray(v))
      }
      var data = response.data
      if (isObject(data)) {
        return {
          count: data.count,
          next: data.next,
          previous: data.previous,
          list: data.results
        }
      } else if (isArray(data)) {
        return {
          list: data
        }
      }
    }
  }]
})