( /* eslint-disable complexity */ /* eslint-disable max-statements */ /* eslint-disable no-shadow-restricted-names */
  function(ns, undefined) {
    /* eslint-enable complexity */
    /* eslint-enable max-statements */ /* eslint-enable no-shadow-restricted-names */
    var __json_content_type__ = 'application/json; charset=UTF-8',

      __dom_node_type_element__ = 1, // ELEMENT_NODE
      __dom_node_type_comment__ = 8, // COMMENT_NODE

      __allowed_field_types__ = ['string', 'uuid', 'integer', 'decimal', 'datetime', 'boolean', 'array'],
      __allowed_child_types__ = ['string', 'uuid', 'integer', 'decimal', 'datetime', 'boolean'],
      __allowed_key_types__ = ['Uuid', 'Integer', 'Object'],

      __named_resource_regex__ = /^{([a-z][0-9a-zA-Z_]+)}([A-Za-z][0-9a-zA-Z_]+)\|(.*)$/,
      __resource_regex__ = /^([A-Za-z][0-9a-zA-Z_]+)\|(.*)$/,
      __named_model_regex__ = /^{([a-z][0-9a-zA-Z_]+)}([A-Za-z][0-9a-zA-Z_]+)$/,
      __pk_regex__ = /(^([^\?]+)$|^([^\?]+)\?(.*)$)/,
      __template_regex__ = /({{[^{}]+}})/g,
      __meta_attrib_regex__ = /^setu\-([a-z])([a-z]+)$/,
      __loop_regex__ = /([a-zA-Z][a-zA-Z0-9_\.]*)[\s]*in[\s]*([a-zA-Z][a-zA-Z0-9_\.]+)/,
      __declare_regex__ = /([a-zA-Z][a-zA-Z0-9_]*)[\s]*=[\s]*(.*)+/,
      __list_regex__ = /(^(list):([A-Z][A-Za-z0-9_]+)$)|(^(list):([A-Z][A-Za-z0-9_]+)\|(.*)$)/,
      __create_regex__ = /^(create):([A-Z][A-Za-z0-9_]+)$/,

      __meta_attr_bind__ = 'setu-bind',
      __meta_attr_click__ = 'setu-click',
      __meta_attr_declare__ = 'setu-declare',
      __meta_attr_if__ = 'setu-if',
      __meta_attr_include__ = 'setu-include',
      __meta_attr_instance__ = 'setu-instance',
      __meta_attr_loop__ = 'setu-loop',
      __meta_attr_model__ = 'setu-model',
      __meta_attr_pass__ = 'setu-pass',
      __meta_attr_require__ = 'setu-require',
      __meta_attr_replace__ = 'setu-replace',
      __meta_attr_params__ = 'setu-params',
      __meta_attributes__ = [
        __meta_attr_bind__, __meta_attr_click__,
        __meta_attr_declare__, __meta_attr_if__,
        __meta_attr_include__, __meta_attr_instance__,
        __meta_attr_loop__, __meta_attr_model__,
        __meta_attr_pass__, __meta_attr_require__
      ],

      __keyword_list__ = 'list',
      __keyword_detail__ = 'detail',
      __keyword_create__ = 'create',
      __keyword_update__ = 'update',
      __keyword_model__ = 'model',
      __keyword_instance__ = 'instance',

      __event_list_resource_create__ = 'ListResourceCreate',
      __event_list_resource_change__ = 'ListResourceChange',
      __event_detail_resource_change__ = 'DetailResourceChange',
      __event_detail_resource_delete__ = 'DetailResourceDelete',
      __event_before_element_delete__ = 'BeforeElementDelete',
      __event_instance_change__ = 'InstanceChange',
      __event_instance_create__ = 'InstanceCreate',
      __event_instance_delete__ = 'InstanceDelete',
      __event_instance_save__ = 'InstanceSave'

    __badly_configured_msg__ = "Improperly configured Setu application",
      __invalid_meta_msg__ = "Invalid Setu meta syntax",
      __internal_error_msg__ = "Setu internal error"

    var temp = []
    __meta_attributes__.forEach(function(attr) {
      temp.push('[' + attr + ']')
    })

    var __meta_attribs_selector__ = temp.join(',')

    Array.prototype.contains = function(element) {
      return (-1 !== this.indexOf(element))
    }

    /*Array.prototype.checkAndPush = function(element) {
      if (!this.contains(element)) {
        this.push(element)
      }
    }*/

    Array.prototype.remove = function(element, howMany) {
      var idx
      if (-1 !== (idx = this.indexOf(element))) {
        this.splice(idx, howMany || 1)
      }
    }

    function isArray(v) {
      return ('[object Array]' === Object.prototype.toString.call(v))
    }

    function isObject(v) {
      return ('object' === typeof(v) && !isArray(v))
    }

    var SetuLogLevels = {
      'error': 1,
      'warn': 2,
      'info': 3,
      'log': 4,
      'debug': 5,
    }

    var SetuLogLevel = 5

    function dummy() {}

    console.debug = console.debug || dummy
    console.log = console.log || dummy

    console.group = console.group || dummy
    console.groupEnd = console.groupEnd || dummy

    console.time = console.time || dummy
    console.timeEnd = console.timeEnd || dummy

    var console_time = console.time || dummy
    var console_timeEnd = console.timeEnd || dummy
    var console_info = console.info || dummy
    var console_warn = console.warn || dummy
    var console_error = console.error || dummy

    /**
     * Set logging level
     * @method log_set_level
     */
    function log_set_level(level) {
      if (SetuLogLevels[level]) {
        SetuLogLevel = SetuLogLevels[level]
      }
      for (level in SetuLogLevels) {
        if (SetuLogLevels[level] <= SetuLogLevel) {
          console[level] = console[level] || dummy
        } else {
          console[level] = dummy
        }
      }
      console.group = console.group && dummy !== console.info ? console.group : dummy
      console.groupEnd = console.groupEnd && dummy !== console.info ? console.groupEnd : dummy
      console_time = console.time && dummy !== console.error ? console.time : dummy
      console_timeEnd = console.timeEnd && dummy !== console.error ? console.timeEnd : dummy
      console.time = console.time && dummy !== console.info ? console.time : dummy
      console.timeEnd = console.timeEnd && dummy !== console.info ? console.timeEnd : dummy
      console_info = console.info
      console_warn = console.warn
      console_error = console.error
      console.debug('Setu.log', 'level', SetuLogLevel)
    }

    function filter_datetime(datestr) {
      return (new Date(datestr)).toLocaleString()
    }

    var SetuFilters = {
      datetime: filter_datetime
    }

    function _ajax(method, url, options, success, error) {
      options = options || {}
      options.method = method || 'GET'
      options.cache = options.cache || false
      options.beforeSend = options.beforeSend || function(xhr, settings) {
        adapters_run('ajax.beforeSend', xhr, settings, this)
      }
      options.success = function(data, status, url, xhr) {
        console.debug('Setu.http ajax $', url, method, status, data)
        try {
          adapters_run('ajax.done', data, status, url, xhr)
        } catch (e) {
          // ignore exception as we need to get our callbacks done
        }
        if (success) {
          success({
            data: data,
            status: status,
            xhr: xhr,
            url: url
          })
        }
      }
      options.error = function(err, status, url, xhr) {
        console_error('Setu.http ajax !', url, method, status, err)
        try {
          adapters_run('ajax.done', err, status, url, xhr)
        } catch (e) {
          // ignore exception as we need to get our callbacks done
        }
        if (error) {
          error(Error(JSON.stringify({
            status: status,
            error: err,
            url: url
          })))
        }
      }
      $_.ajax(url, options)
    }

    function GET(url, options, success, error) {
      return _ajax('GET', url, options, success, error)
    }

    function POST(url, options, success, error) {
      return _ajax('POST', url, options, success, error)
    }

    function PATCH(url, options, success, error) {
      return _ajax('PATCH', url, options, success, error)
    }

    function PUT(url, options, success, error) {
      return _ajax('PUT', url, options, success, error)
    }

    function DELETE(url, options, success, error) {
      return _ajax('DELETE', url, options, success, error)
    }

    var SetuAdapters = {}

    function adapters_register(purpose, procedure, context) {
      SetuAdapters[purpose] = SetuAdapters[purpose] || []
      SetuAdapters[purpose].push([context, procedure])
      console.debug('Setu.adapters +', purpose, context, procedure)
    }

    function adapters_run(purpose) {
      if (!SetuAdapters[purpose]) {
        return []
      }
      var args = Array.prototype.slice.apply(arguments),
        results = []
      SetuAdapters[purpose].forEach(function(registry) {
        args[0] = registry[0]
        results.push(registry[1].apply(null, args))
      })
      console.debug('Setu.adapters >', purpose, results)
      return results
    }

    ns.adapters = {}

    var SetuEventsConsumers = {},
      SetuEventsKeyedConsumers = {}

    SetuEventsConsumers[__event_list_resource_create__] = []
    SetuEventsConsumers.FormSuccess = []
    SetuEventsConsumers.PageRender = []
    SetuEventsConsumers.MetaRender = []
    SetuEventsConsumers.PageBegin = []

    SetuEventsKeyedConsumers[__event_before_element_delete__] = {}
    SetuEventsKeyedConsumers[__event_detail_resource_change__] = {}
    SetuEventsKeyedConsumers[__event_instance_change__] = {}
    SetuEventsKeyedConsumers[__event_instance_create__] = {}
    SetuEventsKeyedConsumers[__event_instance_delete__] = {}
    SetuEventsKeyedConsumers[__event_instance_save__] = {}
    SetuEventsKeyedConsumers[__event_list_resource_change__] = {}

    function events_register(type, handler, context) {
      if (!SetuEventsConsumers[type].contains(context)) {
        SetuEventsConsumers[type].push(context)
        SetuEventsConsumers[type].push(handler)
        console.debug('Setu.events +', type, context, handler)
      }
    }

    function events_register_from(type, key, handler, context) {
      SetuEventsKeyedConsumers[type][key] = SetuEventsKeyedConsumers[type][key] || []
      if (!SetuEventsKeyedConsumers[type][key].contains(context)) {
        SetuEventsKeyedConsumers[type][key].push(context)
        SetuEventsKeyedConsumers[type][key].push(handler)
        console.debug('Setu.events +', type, key, context, handler)
      }
    }

    function events_fire(type, producer, data) {
      var registry = SetuEventsConsumers[type].slice()
      for (var i = 0; i < registry.length; i += 2) {
        try {
          console.debug('Setu.events -->', type, producer, data, registry[i], registry[i + 1])
          registry[i + 1](registry[i], producer, data)
        } catch (e) {
          console_info('Setu.events !', type, producer, data, e.message, e.stack)
        }
      }
    }

    function events_fire_for(type, key, producer, data) {
      var registry = SetuEventsKeyedConsumers[type][key]
      if (registry) {
        registry = registry.slice()
        for (var i = 0; i < registry.length; i += 2) {
          try {
            console.debug('Setu.events -->', type, key, producer, data, registry[i], registry[i + 1])
            registry[i + 1](registry[i], producer, data)
          } catch (e) {
            console_info('Setu.events !', type, key, producer, data, e.message, e.stack)
          }
        }
      }
    }

    function events_unregister(type, context) {
      SetuEventsConsumers[type].remove(context, 2)
      console.debug('Setu.events x', type, context)
    }

    function events_unregister_from(type, key, context) {
      SetuEventsKeyedConsumers[type][key].remove(context, 2)
      console.debug('Setu.events x', type, key, context)
    }

    ns.register = events_register
    ns.unregister = events_unregister

    ns.models = {}

    ns.models.NameResolutionDefault = {

      m2p: function(name) {
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
        return (
          name.replace(/^([A-Z])/, function(v) {
            return v.toLowerCase()
          })
          .replace(/([A-Z])/g, function(v) {
            return '_' + v.toLowerCase()
          }))
      },

      i2m: function(name) {
        return (
          name.replace(/^([a-z])/, function(v) {
            return v.toUpperCase()
          })
          .replace(/(_[a-z])/g, function(v) {
            return v.charAt(1).toUpperCase()
          }))
      },

      m2l: function(name) {
        return (this.m2i(name) + 's')
      },

      l2m: function(name) {
        return (this.i2m(name).replace(/s$/, ''))
      }
    }

    var SetuModels = {},
      SetuModelsFilters,
      SetuModelsConfig,
      SetuNameResolution

    function models_setup(specs, filters, config) {
      SetuModelsConfig = config || {
        trailingSlash: true,
        nameResolution: 'Setu.models.NameResolutionDefault',
        urlPrefix: ''
      }
      SetuModelsFilters = filters || {}
      SetuNameResolution = eval(SetuModelsConfig.nameResolution)
      _models_parse_specs(specs)
      console.debug('Setu.models $ setup')
    }

    function models_get(name) {
      if (!SetuModels[name]) {
        console_error('Setu.models !', name, 'not defined by application')
        throw new TypeError(__badly_configured_msg__)
      }
      return SetuModels[name]
    }

    function _models_parse_specs(specs) {
      for (var name in specs) {
        var model = {}
        var primaryKeyCount = 0
        var modelSpec = specs[name]
        if (modelSpec.__dirty__ || modelSpec.__model || modelSpec.__key) {
          console_error('Setu.models', 'restricted keywords __dirty__, __model, and __key cannot be used as model fields')
          throw new TypeError(__badly_configured_msg__)
        }
        for (var field in modelSpec) {
          var fieldSpec = modelSpec[field]
          if ('string' === typeof(fieldSpec)) {
            if (!specs[fieldSpec]) {
              console_error('Setu.models', 'model', name, 'refers to', fieldSpec, 'model; but no specification for the latter provided')
              throw new TypeError(__badly_configured_msg__)
            }
          } else if (isArray(fieldSpec)) {
            if (!__allowed_field_types__.contains(fieldSpec[0])) {
              console_error('Setu.models', 'model', name, 'field', field, 'has an unidentified type', fieldSpec[0])
              throw new TypeError(__badly_configured_msg__)
            }
            if ('array' === fieldSpec[0]) {
              if (fieldSpec[1].match(/^[a-z]/)) {
                if (!__allowed_child_types__.contains(fieldSpec[1])) {
                  console_error('Setu.models', 'model', name, 'field', field, 'is an array of unsupported type of elements', fieldSpec[1])
                  throw new TypeError(__badly_configured_msg__)
                }
              }
            }
            if (fieldSpec.contains('primaryKey')) {
              primaryKeyCount++
              model.primaryKey = field
            }
          } else {
            console_error('Setu.models', 'model', name, 'field', field, 'invalid specification', fieldSpec)
            throw new TypeError(__badly_configured_msg__)
          }
        }
        if (1 !== primaryKeyCount) {
          console_error('Setu.models', 'model', name, 'exactly one primary key needs to be specified')
          throw new TypeError(__badly_configured_msg__)
        }
        model.name = name
        model.pathPrefix = SetuModelsConfig.urlPrefix + '/' + SetuNameResolution.m2p(model.name)
        model.spec = modelSpec
        model.instanceType = _models_create_instance_type(model)
        SetuModels[name] = model
        console.debug('Setu.models +', model)
      }
    }

    function _models_create_instance_type(model) {
      var object = {}
      for (var field in model.spec) {
        object[field] = {
          get: (function(field) {
            return function() {
              return this['__' + field]
            }
          })(field),
          set: (function(field) {
            return function(newValue) {
              var oldValue = this['__' + field]
              this['__' + field] = newValue
              if (oldValue !== newValue) {
                if (!this.__created || this.__dontFireChange) return
                instances_onchange(this, field, oldValue, newValue)
              }
            }
          })(field),
          enumerable: true
        }
      }
      return object
    }

    function models_create_instance(model) {
      var instance = Object.create(Object.prototype, model.instanceType)
      for (var field in model.spec) {
        var fieldSpec = model.spec[field]
        var initValue = (isArray(fieldSpec) && 'array' === fieldSpec[0] ? [] : undefined)
        instance['__' + field] = initValue
      }
      instance.__model = model
      instance.__dirty__ = {}
      return instance
    }

    function models_list(model, params, success, error) {
      if (!params) {
        params = ''
      }
      var url = model.pathPrefix + (params || SetuModelsConfig.trailingSlash ? '/' : '') + (params ? '?' + params : '')
      GET(url, {
        format: 'json'
      }, function(response) {
        var output = adapters_run('models.listOutput', response)[0]
        // TODO what to do with the page information here
        var instances = []
        output.forEach(function(detail) {
          var instance = models_create_instance(model)
          instances_init(instance, detail)
          instances.push(instance)
        })
        console.debug('Setu.models $ list', model, instances)
        success(instances)
      }, function(e) {
        console.log('Setu.models ! list', model, e.message, e.stack)
        if (error) {
          error([])
        }
      })
    }

    function models_detail(model, pk, success, error) {
      var pk_match = pk.match(__pk_regex__),
        pk_parts = [pk_match[2] || pk_match[3], pk_match[4]],
        url = model.pathPrefix + '/' + pk_parts[0] +
        (SetuModelsConfig.trailingSlash ? '/' : '') +
        (pk_parts[1] ? '?' + pk_parts[1].replace(/:/, '=') : '')
      GET(url, {
          format: 'json'
        }, function(response) {
          var data = response.data
          var instance = models_create_instance(model)
          instances_init(instance, data)
          console.debug('Setu.models $ detail', model, pk, instance)
          success(instance)
        },
        function(e) {
          console.debug('Setu.models ! detail', model, e.message, e.stack)
          if (error) {
            error({})
          }
        })
    }

    function instances_init(instance, params) {
      if (params) {
        var spec = instance.__model.spec
        for (var key in params) {
          if (spec[key]) {
            instance[key] = params[key]
          }
        }
        instance.__created = true
        instance.__key = instance.__model.name + '|' + instance[instance.__model.primaryKey]
        resources_register_instance(instance)
      }
    }

    function instances_onchange(instance, field, oldVal, newVal) {
      instance.__dirty__[field] = true
      events_fire_for(__event_instance_change__, instance.__key, instance, {
        field: field,
        oldVal: oldVal,
        newVal: newVal
      })
    }

    function instances_filter(instance, name) {
      var modelFilters = SetuModelsFilters[instance.__model.name]
      if (modelFilters && modelFilters[name]) {
        return modelFilters[name](instance)
      }
      return undefined
    }

    function instances_save(instance, success, error) {
      if (instance.__created) {
        return _instances_update(instance, success, error)
      } else {
        return _instances_create(instance, success, error)
      }
    }

    function _instances_create(instance, success, error) {
      if (instance.__created) {
        console_error('Setu.instances', 'internal programming error or user forced create of an already created instance', instance)
        success(instance)
        return
      }
      var url = instance.__model.pathPrefix + (SetuModelsConfig.trailingSlash ? '/' : '')
      if (instance.__queryparams) {
        url += '?' + instance.__queryparams
        delete instance.__queryparams
      }
      var dataToSend = {}
      for (var key in instance.__model.spec) {
        if ('string' === typeof(instance.__model.spec[key]) || !instance.__model.spec[key].contains('auto')) {
          dataToSend[key] = instance[key]
        }
      }
      POST(url, {
        data: dataToSend,
        contentType: __json_content_type__,
        format: 'json'
      }, function(response) {
        var data = response.data
        instances_init(instance, data)
        console.debug('Setu.instances +', instance)
        events_fire_for(__event_instance_create__, instance.__model.name, instance)
        success(instance)
      }, function(e) {
        console.debug('Setu.instances ! create', e.message, e.stack)
        if (error) error({})
      })
    }

    function _instances_update(instance, success, error) {
      if (!instance.__created) {
        console_error('Setu.instances', 'internal programming error or user forced update of an instance that does not exist in backend', instance)
        success(instance)
        return
      }
      var url = instance.__model.pathPrefix + '/' +
        instance[instance.__model.primaryKey] +
        (SetuModelsConfig.trailingSlash ? '/' : '')
      if (instance.__queryparams) {
        url += '?' + instance.__queryparams
        delete instance.__queryparams
      }
      var dataToSend = {}
      for (var key in instance.__dirty__) {
        dataToSend[key] = instance[key]
      }
      PATCH(url, {
        data: dataToSend,
        contentType: __json_content_type__
      }, function(response) {
        var data = response.data
        instance.__dontFireChange = true
        for (var key in data) {
          if (instance.__model.spec[key]) {
            instance[key] = data[key]
          }
        }
        instance.__dirty__ = {}
        instance.__dontFireChange = false
        console.debug('Setu.instances ~', instance)
        events_fire_for(__event_instance_save__, instance.__model.name, instance)
        success(instance)
      }, function(e) {
        console.debug('Setu.instances ! update', instance, e.message, e.stack)
        if (error) error({})
      })
    }

    /*function instances_delete(instance) {
      events_fire_for(__event_instance_delete__, instance.__key, instance)
      events_fire_for(__event_instance_delete__, instance.__model.name, instance)
    }*/

    var SetuGlobals = window,
      SetuSetVariables = {},
      SetuEvent

    function evals_clear() {
      for (var key in SetuSetVariables) {
        delete SetuGlobals[key]
      }
      SetuSetVariables = {}
      SetuEvent = undefined
      console.debug('Setu.evals x all', SetuSetVariables)
    }

    function evals_set(key, value) {
      SetuGlobals[key] = value
      SetuSetVariables[key] = true
      if ('event' === key) SetuEvent = value
      console.debug('Setu.evals +', key, SetuGlobals[key])
    }

    function evals_get(key) {
      return SetuGlobals[key]
    }

    function evals_add(object) {
      for (var key in object) {
        var value = object[key]
        SetuGlobals[key] = value
        SetuSetVariables[key] = true
        if ('event' === key) SetuEvent = value
        console.debug('Setu.evals +', key, SetuGlobals[key])
      }
    }

    function evals_parse_templates(resources, expr) {
      if (!resources.event && SetuEvent && SetuGlobals.event !== SetuEvent) {
        SetuGlobals.event = SetuEvent
      }
      evals_add(resources)
      var ret = expr.replace(__template_regex__, function(match) {
        var parsed = match.replace(/[{}]/g, '').replace(/\s*\|\s*/, '|')
        parts = parsed.split('|')
        try {
          var val = eval(parts[0])
          if (undefined === val) return match
          for (var i = 1; i < parts.length; ++i) {
            var part = parts[i]
            if (!SetuFilters[part]) {
              val = val[eval(part)]
            } else {
              val = SetuFilters[part](val)
            }
            if (undefined === val) return match
          }
          return val
        } catch (e) {
          console.log('Setu.evals ! template', match, e.message, e.stack)
          return match
        }
      })
      evals_remove(Object.keys(resources))
      return ret
    }

    function evals_parse_expr(resources, expr) {
      if (!resources.event && SetuEvent && SetuGlobals.event !== SetuEvent) {
        SetuGlobals.event = SetuEvent
      }
      evals_add(resources)
      var result
      try {
        if (!expr.match(__template_regex__)) {
          result = eval(expr)
        } else {
          result = eval(evals_parse_templates({}, expr))
        }
      } catch (e) {
        console.log('Setu.evals ! expr', expr, e.message, e.stack)
        return expr
      }
      evals_remove(Object.keys(resources))
      return result
    }

    function evals_remove(keys) {
      keys.forEach(function(key) {
        if (SetuGlobals[key]) {
          SetuGlobals[key] = undefined
        }
        SetuSetVariables[key] = undefined
        if ('event' === key) SetuEvent = undefined
        console.debug('Setu.evals x', key, SetuGlobals[key])
      })
    }

    ns.set = evals_set

    function lists_register_events(resource) {
      if (!resource.registered) {
        events_register_from(__event_instance_create__, resource.model.name, _lists_on_instance_create, resource)
        events_register_from(__event_instance_save__, resource.model.name, _lists_on_instance_save, resource)
        events_register_from(__event_instance_delete__, resource.model.name, _lists_on_instance_delete, resource)
        resource.registered = true
      }
    }

    function lists_unregister_events(resource) {
      if (resource.registered) {
        events_unregister_from(__event_instance_create__, resource.model.name, resource)
        events_unregister_from(__event_instance_save__, resource.model.name, resource)
        events_unregister_from(__event_instance_delete__, resource.model.name, resource)
        resource.registered = false
      }
    }

    function _lists_on_instance_create(resource, instance) {
      if (_lists_instance_belongs(resource, instance)) {
        _lists_add_instance(resource, instance)
      }
    }

    function _lists_on_instance_save(resource, instance) {
      var belongs = _lists_instance_belongs(resource, instance)
      var contains = resource.value.contains(instance)
      if (belongs && !contains) {
        _lists_add_instance(resource, instance, true)
      } else if (!belongs && contains) {
        _lists_remove_instance(resource, instance, true)
      }
    }

    function _lists_on_instance_delete(resource, instance) {
      if (resource.value.contains(instance)) {
        _lists_remove_instance(resource, instance)
      }
    }

    function _lists_instance_belongs(resource, instance) {
      if (resource.params) {
        for (var key in resource.params) {
          if (instance[key]) {
            if (resource.params[key] != instance[key]) {
              console.debug('Setu.lists', instance, 'not in', resource)
              return false
            }
          } else {
            if (resource.params[key] != instances_filter(instance, key)) {
              console.debug('Setu.lists', instance, 'not in', resource)
              return false
            }
          }
        }
      }
      return true
    }

    function _lists_add_instance(resource, instance, needRefresh) {
      resource.value.unshift(instance)
      console.debug('Setu.lists [+]', resource, instance)
      if (resource.value.length > 1) {
        if (!needRefresh) {
          events_fire_for(__event_list_resource_change__, resource.key, resource)
        } else {
          application_refresh()
        }
      } else {
        if (!needRefresh) {
          events_fire(__event_list_resource_create__, resource)
        } else {
          application_refresh()
        }
      }
    }

    function _lists_remove_instance(resource, instance, needRefresh) {
      resource.value.remove(instance)
      console.debug('Setu.lists [-]', resource, instance)
      if (!needRefresh) {
        events_fire_for(__event_list_resource_change__, resource.key, resource)
      } else {
        application_refresh()
      }
    }

    function details_register_events(resource) {
      if (!resource.registered) {
        events_register_from(__event_instance_change__, resource.value.__key, _details_on_instance_change, resource)
        events_register_from(__event_instance_delete__, resource.value.__key, _details_on_instance_delete, resource)
        resource.registered = true
      }
    }

    function details_unregister_events(resource) {
      if (resource.registered) {
        events_unregister_from(__event_instance_change__, resource.value.__key, resource)
        events_unregister_from(__event_instance_delete__, resource.value.__key, resource)
        resource.registered = false
      }
    }

    function _details_on_instance_change(resource, instance, data) {
      data.key = resource.key
      events_fire_for(__event_detail_resource_change__, resource.key, resource, data)
    }

    function _details_on_instance_delete(resource) {
      // do nothing as of now
    }

    var SetuResources,
      SetuResourcesSpecs

    function resources_setup(specs) {
      SetuResourcesSpecs = specs
      SetuResources = {}
      console.debug('Setu.resources $ setup')
    }

    function resources_exist(which) {
      if (!which || !which.length) {
        return false
      }
      var resources = {}
      which.every(function(req) {
        var title = req.title,
          resource
        if ((resource = SetuResources[req.key]) && resource.value) {
          resources[title] = resource.value
          return true
        } else {
          resources = false
          return false
        }
      })
      return resources
    }

    function resources_get(which, needed, success) {
      if (!which || !which.length) {
        success({})
        return
      }
      console.time('resources')
      var results = {}
      which.forEach(function(req) {
        var resource = 'string' === typeof(req) ?
          resources_dissect_key(needed, req) :
          req
        var title = resource.title
        if (!SetuResources[resource.key]) {
          SetuResources[resource.key] = resource
          console.debug('Setu.resources +', resource.key, resource)
        } else {
          resource = SetuResources[resource.key]
          console.debug('Setu.resources .', resource.key, resource)
        }
        _resources_get_one(title, resource, function(result) {
          results[result.title] = result.value
          if (Object.keys(results).length === which.length) {
            console.debug('Setu.resources obtained', results)
            console.timeEnd('resources')
            success(results)
          }
        })
      })
    }

    function resources_flush(key) {
      if (SetuResources[key]) {
        _resources_remove(SetuResources[key])
        delete SetuResources[key]
      }
      console.debug('Setu.resources x', key)
    }

    function resources_flush_all() {
      for (var key in SetuResources) {
        _resources_remove(SetuResources[key])
        delete SetuResources[key]
      }
      console.debug('Setu.resources x all')
    }

    function resources_register_instance(instance) {
      if (!SetuResources[instance.__key]) {
        var resource = {
          type: __keyword_detail__,
          key: instance.__key,
          title: SetuNameResolution.m2i(instance.__model.name),
          model: instance.__model,
          pk: instance[instance.__model.primaryKey],
          value: instance
        }
        details_register_events(resource)
        SetuResources[instance.__key] = resource
        console.debug('Setu.resources + instance', instance)
      }
    }

    function _resources_parse_key(needed, key) {
      var resource, match, saveKey = key
      if (key.match(__template_regex__)) {
        try {
          key = evals_parse_templates(needed, key)
        } catch (e) {
          console.log('Setu.resources ! key templates', key, e.message, e.stack)
        }
      }
      if (match = key.match(__named_resource_regex__)) {
        resource = {
          title: match[1],
          model: models_get(match[2]),
          params: match[3],
          key: match[2] + '|' + match[3]
        }
      } else if (match = key.match(__named_model_regex__)) {
        resource = {
          title: match[1],
          model: models_get(match[2]),
          key: match[2]
        }
      } else if (match = key.match(__resource_regex__)) {
        resource = {
          title: key,
          model: models_get(match[1]),
          params: match[2],
          key: key
        }
      } else {
        resource = {
          title: key,
          model: models_get(key),
          key: key
        }
      }
      if (!resource.params || resource.params.match(/=/)) {
        resource.type = __keyword_list__
        if (resource.title === key) {
          resource.title = SetuNameResolution.m2l(resource.model.name)
        }
      } else {
        if (!resource.params) {
          console_error('Setu.resources !', 'invalid instance key', key)
          throw new TypeError(__invalid_meta_msg__)
        }
        resource.type = __keyword_detail__
        if (resource.title === key) {
          resource.title = SetuNameResolution.m2i(resource.model.name)
        }
        resource.pk = resource.params
        resource.params = undefined
      }
      console.debug('Setu.resources $ parsed', saveKey, key, resource)
      return resource
    }

    function resources_get_generic_title(resource) {
      if (__keyword_list__ === resource.type) {
        return SetuNameResolution.m2l(resource.model.name)
      } else if (__keyword_detail__ === resource.type) {
        return SetuNameResolution.m2i(resource.model.name)
      }
      return undefined
    }

    function _resources_remove(resource) {
      if (__keyword_list__ === resource.type) {
        lists_unregister_events(resource)
      } else if (__keyword_detail__ === resource.type) {
        details_unregister_events(resource)
      }
    }

    function resources_dissect_key(needed, key) {
      var spec = SetuResourcesSpecs[key]
      if (spec) {
        return {
          type: 'api',
          key: key,
          title: key,
          api: spec
        }
      }
      var resource = _resources_parse_key(needed, key)
      if (__keyword_list__ === resource.type) {
        if (resource.params) {
          resource.queryparams = resource.params.replace(/;/, '&')
          var params = resource.params.split(';')
          resource.params = {}
          params.forEach(function(p) {
            var parts = p.split('=')
            resource.params[parts[0]] = parts[1]
          })
        }
      }
      return resource
    }

    function _resources_get_one(title, resource, success) {
      switch (resource.type) {
        case __keyword_list__:
          if (resource.value) {
            success({
              title: title,
              value: resource.value
            })
          } else {
            models_list(resource.model, resource.queryparams, function(list) {
              resource.value = list
              lists_register_events(resource)
              success({
                title: title,
                value: resource.value
              })
            }, function(empty) {
              success({
                title: title,
                value: empty
              })
            })
          }
          break
        case __keyword_detail__:
          if (resource.value) {
            success({
              title: title,
              value: resource.value
            })
          } else {
            models_detail(resource.model, resource.pk, function(instance) {
              resource.value = instance
              details_register_events(resource)
              success({
                title: title,
                value: resource.value
              })
            }, function(empty) {
              success({
                title: title,
                value: empty
              })
            })
          }
          break
        case 'api':
          if (resource.value) {
            success({
              title: title,
              value: resource.value
            })
          } else {
            GET(resource.api, {
              format: 'json'
            }, function(response) {
              resource.value = response.data
              success({
                title: title,
                value: resource.value
              })
            }, function(e) {
              success({
                title: title,
                value: undefined
              })
            })
          }
          break
      }
    }

    ns.get = resources_get

    function meta_is_scope(element) {
      return (_meta_has_attrs(element) ||
        _meta_has_templates(element) ||
        element.querySelectorAll(__meta_attribs_selector__).length)
    }

    function _meta_has_templates(element) {
      return (element.outerHTML && element.outerHTML.match(__template_regex__))
    }

    function _meta_has_attrs(element) {
      for (var i = 0; i < __meta_attributes__.length; ++i) {
        if (element.hasAttribute(__meta_attributes__[i])) {
          return true
        }
      }
      return false
    }

    function meta_parse_click(element) {
      var str = element.getAttribute(__meta_attr_click__)
      if (!str) {
        return null
      }
      var match
      if (-1 !== [__keyword_detail__, __keyword_update__].indexOf(str)) {
        return {
          type: str
        }
      } else if (match = str.match(__list_regex__)) {
        return {
          type: __keyword_list__,
          modelName: match[2] || match[6],
          filter: match[3] || match[7]
        }
      } else if (match = str.match(__create_regex__)) {
        return {
          type: __keyword_create__,
          modelName: match[2]
        }
      } else {
        return {
          type: 'generic',
          code: str
        }
      }
    }

    function meta_parse_form(form) {
      if (form.hasAttribute(__meta_attr_model__)) {
        return {
          type: __keyword_model__,
          model: models_get(form.getAttribute(__meta_attr_model__))
        }
      } else if (form.hasAttribute(__meta_attr_instance__)) {
        var key = form.getAttribute(__meta_attr_instance__)
        var resource = resources_dissect_key(form.setu.needed, key)
        if (__keyword_detail__ !== resource.type) {
          console_error('Setu.meta !', 'invalid instance key', key, form)
          throw new TypeError(__invalid_meta_msg__)
        }
        return {
          type: __keyword_instance__,
          resource: resource
        }
      }
      return null
    }

    function meta_parse_bind(element) {
      return _meta_parse_to_safe(element, __meta_attr_bind__)
    }

    function meta_parse_require(element) {
      return _meta_parse_to_safe(element, __meta_attr_require__)
    }

    function _meta_parse_to_safe(element, attrib) {
      if (!element.hasAttribute(attrib)) {
        return []
      }
      var array = element.getAttribute(attrib).split(',')
      for (var i = 0; i < array.length; ++i) {
        var resource = resources_dissect_key(element.setu.needed, array[i])
        if (__keyword_list__ !== resource.type && __keyword_detail__ !== resource.type) {
          console_error('Setu.meta !', 'invalid key', attrib, array[i], element)
          throw new TypeError(__invalid_meta_msg__)
        }
        array[i] = resource
      }
      return array
    }

    var ScopesKeyCounter = 10000

    function scopes_overwrite(element, data) {
      var temp = document.createElement(element.parentElement.tagName)
      temp.innerHTML = data
      element.parentElement.insertBefore(temp.firstElementChild, element)
      temp.remove()
      var setu = element.setu
      element = element.previousElementSibling
      element.setu = setu
      scopes_remove(element.nextElementSibling)
      if (element.setu.parent) {
        element.setu.parent.children.push(element)
      }
      return element
    }

    function scopes_create_iteration_element(element, iterator) {
      element.setu.needed[element.setu.contextKey] = iterator
      if (element.outerHTML.match(__template_regex__)) {
        var temp = document.createElement(element.parentElement.tagName)
        temp.innerHTML = evals_parse_templates(element.setu.needed, element.outerHTML)
        element.parentElement.insertBefore(temp.firstElementChild, element)
        temp.remove()
      } else {
        element.parentElement.insertBefore(element.cloneNode(true), element)
      }
      var clone = element.previousElementSibling
      clone.removeAttribute(__meta_attr_loop__)
      _scopes_sibling_copy(element, clone)
      return clone
    }

    function scopes_clone_sibling_with_template(element) {
      var setu = element.setu
      if (!setu) {
        console.error('Setu.scopes !', 'internal error while trying to eval binds', element)
        throw new Error(__internal_error_msg__)
      }
      var temp = document.createElement(element.parentElement.tagName)
      temp.innerHTML = evals_parse_templates(setu.needed, setu.template)
      element.parentElement.insertBefore(temp.firstElementChild, element)
      temp.remove()
      var clone = element.previousElementSibling
      element.classList.forEach(function(cls) {
        clone.classList.add(cls)
      })
      _scopes_sibling_copy(element, clone)
      return clone
    }

    function scopes_setup_element(element) {
      element.setu = element.setu || {}
      element.setu.key = ScopesKeyCounter
        ++ScopesKeyCounter
      console.debug('Setu.scopes $ setup', element, element.setu)
    }

    function scopes_remove(element) {
      var setu = element.setu
      if (setu.children && setu.children.length) {
        console.group()
        var children = setu.children.slice()
        children.forEach(function(child) {
          scopes_remove(child)
        })
        console.groupEnd()
        delete setu.children
      }
      if (setu.parent) {
        setu.parent.setu.children.remove(element)
        delete setu.parent
      }
      events_fire_for(__event_before_element_delete__, setu.key, element)
      element.remove()
      console.debug('Setu.scopes x', element)
    }

    function scopes_avoid_dangling(elements) {
      elements.forEach(function(element) {
        // Each has to be explicitly removed to ensure the parentElement
        // null check works. Otherwise it was not.
        if (element.setu) {
          scopes_remove(element)
        } else {
          element.remove()
        }
      })
    }

    function scopes_setup_child(element, child) {
      child.setuEvalingParent = false
      child.setu = child.setu || {}
      child.setu.needed = child.setu.needed || {}
      var parentNeeded = element.setu.needed,
        childNeeded = child.setu.needed
      for (var title in parentNeeded) {
        childNeeded[title] = parentNeeded[title]
      }
      child.setu.contextKey = element.setu.contextKey
      child.setu.parent = element
      console.debug('Setu.scopes', child, child.setu, '^', element, element.setu)
    }

    function scopes_hide(element) {
      var position = {}
      position.parent = element.parentElement
      position.index = $_(element).index()
      position.data = element.outerHTML
      position.setu = element.setu
      scopes_remove(element)
      console.debug('Setu.scopes _', __meta_attr_if__, position)
      return position
    }

    function scopes_show(position) {
      if (null === position.parent.parentElement) {
        console.log('Setu.scopes !', 'ignoring hidden element under dead parent', position)
        return
      }
      if (position.index > 0) {
        $_(position.parent).nthChild(position.index - 1).after(position.data)
      } else {
        $_(position.parent).prepend(position.data)
      }
      var element = $_(position.parent).nthChild(position.index).element
      element.setu = position.setu
      var ancestor = element.parentElement
      while (ancestor && !ancestor.setu) {
        ancestor = ancestor.parentElement
      }
      if (ancestor) {
        ancestor.setu.children = ancestor.setu.children || []
        ancestor.setu.children.push(element)
        element.setu.parent = ancestor
      }
      console.debug('Setu.scopes $ rebirth', position, element, element.setu)
      return element
    }

    function _scopes_sibling_copy(element, clone) {
      var cloneSetu = clone.setu = {
        needed: {}
      }
      var elementSetu = element.setu
      for (var key in elementSetu) {
        if ('needed' === key) {
          for (var title in elementSetu.needed) {
            cloneSetu.needed[title] = elementSetu.needed[title]
          }
        } else if ('children' !== key) {
          cloneSetu[key] = elementSetu[key]
        }
      }
      if (elementSetu.parent) {
        elementSetu.parent.setu.children.push(clone)
      }
    }

    var SetuHiddenScopes = [],
      SetuParserQueue = [],
      SetuParserRunning = false,
      SetuParserWaitForCount = 0,
      SetuParserNewCount = 0,
      SetuPostMetaDone = false

    function parser_clear() {
      SetuHiddenScopes = []
      SetuParserQueue = []
      SetuParserRunning = false
      SetuParserWaitForCount = 0
      SetuParserNewCount = 0
      SetuPostMetaDone = false
      console.debug('Setu.parser x')
    }

    function parser_run() {
      if (SetuParserRunning) {
        console.debug('Setu.parser running already...')
        return
      }
      console.debug('Setu.parser >', SetuParserQueue.length, 'waiting', SetuParserWaitForCount, 'new', SetuParserNewCount)
      if (!SetuParserQueue.length) {
        console.debug('Setu.parser $ nothing to do')
        if (!SetuParserWaitForCount && !SetuParserNewCount) {
          parser_post_run()
        }
        return
      }
      SetuParserRunning = true
      if (!SetuParserWaitForCount && !SetuParserNewCount) {
        console.time('process-meta')
      }
      if (SetuParserNewCount) {
        --SetuParserNewCount
      }
      var element = SetuParserQueue.shift()
      while (element) {
        element.setuQueued = false
        parser_eval_scope(element)
        element = SetuParserQueue.shift()
      }
      if (SetuParserWaitForCount || SetuParserNewCount) {
        console.debug('Setu.parser _', SetuParserQueue.length, 'waiting', SetuParserWaitForCount, 'new', SetuParserNewCount)
        SetuParserRunning = false
        return
      }
      SetuParserRunning = false
      console.debug('Setu.parser $', SetuParserQueue.length, 'waiting', SetuParserWaitForCount, 'new', SetuParserNewCount)
      console.timeEnd('process-meta')
      events_fire('MetaRender', ns)
      parser_post_run()
    }

    function parser_post_run() {
      if (!SetuPostMetaDone) {
        SetuPostMetaDone = true
        post_meta_process()
        events_fire('PageRender', ns)
      }
    }

    function parser_unhide(key) {
      console.debug('Setu.parser @ unhide', key, SetuHiddenScopes)
      var re = new RegExp("[^a-zA-Z0-9_]" + key + "[^a-zA-Z0-9_]", ''),
        elements = [],
        hidden = []
      SetuHiddenScopes.forEach(function(position) {
        if (position.data && position.data.match(re)) {
          elements.push(scopes_show(position))
        } else {
          hidden.push(position)
        }
      })
      SetuHiddenScopes = hidden
      console.debug('Setu.parser $ unhide', key, SetuHiddenScopes, elements)
      return elements
    }

    function parser_eval_scope(element) {
      // First things first, if your parent got removed, stop right here
      if (null === element.parentNode) {
        console.debug('Setu.parser $ eval dead', element)
        return
      }
      // Do nothing if a parent is being eval'd right now. This happens
      // if observer reports both parent and children
      if (element.setuEvalingParent) {
        console.debug('Setu.parser $ eval ignore', element)
        return
      }
      console.group()
      console.debug('Setu.parser @ eval', element)
      // First disable processing of any children that may have been
      // reported as added by observer
      var children = Array.prototype.slice.call(
        element.querySelectorAll(__meta_attribs_selector__))
      children.forEach(function(child) {
        child.setuEvalingParent = true
      })
      var setu = element.setu = element.setu || {}
      setu.needed = setu.needed || {}
      if (element.hasAttribute(__meta_attr_include__)) {
        // Process the include meta attrib by fetching the corresponding
        // HTML and adding to DOM by replacing this element if it has
        // replace set or replacing the inner html of the element with it
        console.time(__meta_attr_include__)
        console.debug('Setu.parser @ _', __meta_attr_include__, element)
          ++SetuParserWaitForCount
        GET(element.getAttribute(__meta_attr_include__), {}, function(response) {
          console.group()
          console.debug('Setu.parser > @', __meta_attr_include__, element)
            --SetuParserWaitForCount
          if (element.hasAttribute(__meta_attr_replace__)) {
            if (response.data.match(__template_regex__)) {
              element = scopes_overwrite(element,
                evals_parse_templates(element.setu.needed, response.data))
            } else {
              element = scopes_overwrite(element, response.data)
            }
            console.debug('Setu.parser $', __meta_attr_include__, element)
            console.timeEnd(__meta_attr_include__)
            console.groupEnd()
          } else {
            if (response.data.match(__template_regex__)) {
              element.innerHTML = evals_parse_templates(element.setu.needed, response.data)
            } else {
              element.innerHTML = response.data
            }
            element.removeAttribute(__meta_attr_include__)
            if (meta_is_scope(element)) {
              // This element has to be given another chance
              SetuParserQueue.push(element)
              element.setuQueued = true
            }
            console.debug('Setu.parser $', __meta_attr_include__, element)
            console.timeEnd(__meta_attr_include__)
            console.groupEnd()
            // Show the intent by calling this explicitly
            // If parser is still running it would eventually
            // get it from the queue, or it would pick it in
            // a fresh run starting here
            parser_run()
          }
        })
        console.groupEnd()
        return
      }
      if (element.hasAttribute(__meta_attr_require__) && !setu.doneRequire) {
        // Process the require meta attrib by looking at what resources
        // this element requires and in case some or all of them are not
        // available, make the calls to get them and then process this
        // element again
        console.debug('Setu.parser @', __meta_attr_require__, element, setu)
        console.time(__meta_attr_require__)
        var required = meta_parse_require(element)
        var resources
        if (!(resources = resources_exist(required))) {
          console.debug('Setu.parser @ _', __meta_attr_require__, element, setu)
            ++SetuParserWaitForCount
          resources_get(required, {}, function(resources) {
            console.group()
            console.debug('Setu.parser > @', __meta_attr_require__, element, setu)
            for (var title in resources) {
              setu.needed[title] = resources[title]
            }
            setu.doneRequire = true
            // Got things needed to parse this scope, so get
            // another chance
            SetuParserQueue.push(element)
            element.setuQueued = true
              --SetuParserWaitForCount
            console.debug('Setu.parser $', __meta_attr_require__, element, setu)
            console.time(__meta_attr_require__)
            console.groupEnd()
            // Show the intent by calling the parser explicitly
            parser_run()
          })
          console.groupEnd()
          return
        } else {
          for (var title in resources) {
            setu.needed[title] = resources[title]
          }
          setu.doneRequire = true
          console.debug('Setu.parser $', __meta_attr_require__, element, setu)
          console.time(__meta_attr_require__)
        }
      }
      if (element.hasAttribute(__meta_attr_bind__) && !element.setu.template) {
        // If an element has bind set then the first things before moving
        // forward is to remember the template so we can use it later when
        // we process bindings for this element
        console.time(__meta_attr_bind__)
        console.debug('Setu.parser @', __meta_attr_bind__, element, setu)
        if (element.hasAttribute(__meta_attr_loop__)) {
          var loop = element.getAttribute(__meta_attr_loop__)
          element.removeAttribute(__meta_attr_loop__)
          setu.template = element.outerHTML
          element.setAttribute(__meta_attr_loop__, loop)
        } else {
          setu.template = element.outerHTML
        }
        console.debug('Setu.parser $', __meta_attr_bind__, element, setu)
        console.timeEnd(__meta_attr_bind__)
      }
      var match
      if (element.hasAttribute(__meta_attr_loop__) &&
        (match = element.getAttribute(__meta_attr_loop__).match(__loop_regex__))) {
        // Process loop meta attribute. It's simple. Evaluate the loop expr.
        // Make copy of this element's HTML template parsed using required/set
        // globals per loop container element. The element is also part of
        // the HTML template parsing as well
        console.time(__meta_attr_loop__)
        console.debug('Setu.parser @', __meta_attr_loop__, element, setu)
        var key = match[1],
          array = match[2]
        try {
          array = evals_parse_expr(setu.needed, array)
        } catch (e) {
          console.log('Setu.parser !', __meta_attr_loop__, match[2], element, setu, e.message, e.stack)
          console.timeEnd(__meta_attr_loop__)
          console.groupEnd()
          return
        }
        element.setu.contextKey = key
        array.forEach(function(iterator) {
          var iteration = scopes_create_iteration_element(element, iterator)
          console.debug('Setu.parser >', __meta_attr_loop__, element, key, iterator, iteration)
        })
        if (array.length && meta_is_scope(element.previousElementSibling)) {
          SetuParserNewCount = 1
        }
        scopes_avoid_dangling(children)
        scopes_remove(element)
        console.debug('Setu.parser $', __meta_attr_loop__, element, setu)
        console.timeEnd(__meta_attr_loop__)
        console.groupEnd()
        return
      }
      if (element.hasAttribute(__meta_attr_if__)) {
        // Process if attribute. It's simple. Parse the expression. If the
        // result is false, hide this element. An if element can wake up
        // time and again, so every time we hide it, we also have to clean
        // up the state of its children
        console.time(__meta_attr_if__)
        console.debug('Setu.parser @', __meta_attr_if__, element, setu)
        var expr = element.getAttribute(__meta_attr_if__)
        var condition = false
        try {
          condition = evals_parse_expr(setu.needed, expr)
        } catch (e) {
          console.log('Setu.parser !', __meta_attr_if__, expr, element, e.message, e.stack)
          console.timeEnd(__meta_attr_if__)
          console.groupEnd()
          return
        }
        if (!condition) {
          SetuHiddenScopes.push(scopes_hide(element))
          console.timeEnd(__meta_attr_if__)
          console.groupEnd()
          return
        }
        console.debug('Setu.parser $', __meta_attr_if__, element, setu)
        console.timeEnd(__meta_attr_if__)
      }
      if (element.hasAttribute(__meta_attr_declare__) &&
        (match = element.getAttribute(__meta_attr_declare__).match(__declare_regex__))) {
        console.time(__meta_attr_declare__)
        console.debug('Setu.parser @', __meta_attr_declare__, element, setu)
        var name = match[1],
          rval = match[2]
        try {
          rval = evals_parse_expr(setu.needed, rval)
        } catch (e) {
          console.log('Setu.parser !', __meta_attr_declare__, match[2], element, e.message, e.stack)
          console.groupEnd()
          return
        }
        setu.needed[name] = rval
        console.debug('Setu.parser $', __meta_attr_declare__, element, setu)
        console.timeEnd(__meta_attr_declare__)
      }
      if (element.outerHTML.match(__template_regex__)) {
        console.time('{{}}')
        console.debug('Setu.parser @ {{}}', element, setu)
        evals_add(setu.needed)
        if (element.innerHTML.match(__template_regex__)) {
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
          observer_forego_additions()
          element.innerHTML = evals_parse_templates({}, element.innerHTML)
          scopes_avoid_dangling(children)
          observer_monitor_additions()
          children = Array.prototype.slice.call(
            element.querySelectorAll(__meta_attribs_selector__))
        }
        for (var idx = 0; idx < element.attributes.length; ++idx) {
          var attr = element.attributes[idx]
          if (attr.value.match(__template_regex__)) {
            attr.value = evals_parse_templates({}, attr.value)
          }
        }
        evals_remove(Object.keys(setu.needed))
        console.debug('Setu.parser $ {{}}', element, setu)
        console.timeEnd('{{}}')
      }
      // Time to make the element have a key and other stuff that is relevant
      // to binding
      scopes_setup_element(element)
      // All the children can be processed now
      children.forEach(function(child) {
        scopes_setup_child(element, child)
        if (!child.setuQueued) {
          SetuParserQueue.push(child)
          child.setuQueued = true
        }
      })
      if (children.length) {
        setu.children = children
      }
      if (element.hasAttribute(__meta_attr_click__)) {
        views_setup_click(element)
      }
      if ('form' === element.tagName.toLowerCase()) {
        post_meta_setup_form(element)
      }
      if (element.hasAttribute(__meta_attr_bind__)) {
        binds_setup(element)
      }
      console.debug('Setu.parser $ eval', element, setu)
      console.groupEnd()
    }

    /* TODO in bind case this is needed and see how it changes with new design around needs
      meta_parse_bind(scope.element).forEach(function(resource, idx) {
        required[idx] = resource.key
      })
      var ancestor = scope
      while(ancestor && !ancestor.element.hasAttribute(__meta_attr_require__)) {
        ancestor = ancestor.parent
      }
      if (ancestor) {
        meta_parse_require(ancestor.element).forEach(function(resource) {
          required.push(resource.key)
        })
      }
    */

    function post_meta_setup_form(form) {
      if (null === form.parentNode) {
        return
      }
      if (form.setuForm) {
        return
      }
      events_register('MetaRender', function(form) {
          events_unregister('MetaRender', form)
          form.querySelectorAll('select').forEach(function(select) {
            var option = select.querySelector('option[selected]')
            if (option) {
              select.value = option.value
            }
          })
          var parsed = meta_parse_form(form)
          if (!parsed) {
            return
          }
          switch (parsed.type) {
            case __keyword_model__:
              _post_meta_setup_form_end(form, models_create_instance(parsed.model))
              break
            case __keyword_instance__:
              var form = form,
                resources
              if ((resources = resources_exist([parsed.resource]))) {
                _post_meta_setup_form_end(form, resources[Object.keys(resources)[0]])
              } else {
                resources_get([parsed.resource], {},
                  function(resources) {
                    _post_meta_setup_form_end(form, resources[Object.keys(resources)[0]])
                  })
              }
              break
          }
        },
        form)
    }

    function _post_meta_setup_form_end(form, instance) {
      form.setuInstance = instance
      _post_meta_setup_form_workflow(form)
      form.setuForm = true
      console.debug('Setu.post-meta $ form', form, form.setuInstance)
    }

    function _post_meta_setup_form_workflow(form) {
      form.onsubmit = function() {
        if (form.hasAttribute('foreign-key')) {
          return false
        }
        try {
          // validate form
          var validation_res = true
          if (!_post_meta_form_validate(form)) {
            validation_res = false
          }
          // validate any related forms (for which this form is a foreign key)
          var relatedForms = document.querySelectorAll('form[foreign-key="' + form.getAttribute('name') + '"]')
          for (var idx = 0; idx < relatedForms.length; ++idx) {
            if (!_post_meta_form_validate(relatedForms[idx])) {
              validation_res = false
            }
          }
          if (!validation_res) {
            return false
          }
          // populate setu instance fields from form controls
          _post_meta_populate_instance(form)
          // reset the related-as field of the main instance
          if (relatedForms.length) {
            _post_meta_reset_related_as(form, relatedForms[0].getAttribute('related-as'))
          }
          // populate setu instances of related forms and copy
          for (var idx = 0; idx < relatedForms.length; ++idx) {
            var relatedForm = relatedForms[idx]
            _post_meta_populate_instance(relatedForm)
            _post_meta_copy_related(relatedForm, form)
          }
          // if any query params are supposed to be sent include them
          if (form.hasAttribute(__meta_attr_params__)) {
            form.setuInstance.__queryparams = form.getAttribute(__meta_attr_params__)
          }
          // execute instance save (create/update)
          instances_save(form.setuInstance, function(instance) {
            console.log('Setu.post-meta $ form-submit', form, instance)
            _post_meta_reset_model_form(form, relatedForms)
            events_fire('FormSuccess', form, instance)
          }, function(empty) {
            _post_meta_reset_model_form(form, relatedForms)
            console_error('Setu.post-meta ! form-submit', form)
          })
          return false
        } catch (e) {
          console_info('Setu.post-meta form-submit', e.message, e.stack)
          return false
        }
      }
    }

    function _post_meta_form_validate(form) {
      var validation_ret = adapters_run('form.validation', form)
      if (-1 !== validation_ret.indexOf(false)) {
        return false
      }
      return true
    }

    function _post_meta_populate_instance(form) {
      var elements = form.elements
      for (var idx = 0; idx < elements.length; ++idx) {
        var elem = elements[idx]
        if (-1 === ['submit', 'reset'].indexOf(elem.getAttribute('type')) &&
          elem.getAttribute('name')) {
          form.setuInstance[elem.getAttribute('name')] = elem.value
        }
      }
      adapters_run('form.fixupInstance', form, form.setuInstance)
    }

    function _post_meta_reset_related_as(form, relatedAs) {
      var fieldSpec = form.setuInstance.__model.spec[relatedAs],
        instance = form.setuInstance
      if (isArray(fieldSpec) && 'array' === fieldSpec[0]) { // many-to-one
        instance[relatedAs] = []
      } else {
        instance[relatedAs] = undefined
      }
    }

    function _post_meta_copy_related(relatedForm, form) {
      var relatedAs = relatedForm.getAttribute('related-as'),
        fieldSpec = form.setuInstance.__model.spec[relatedAs],
        instance = relatedForm.setuInstance,
        copyInstance = {}
      for (var key in instance.__model.spec) {
        if ('string' === typeof(instance.__model.spec[key]) || !instance.__model.spec[key].contains('auto')) {
          copyInstance[key] = instance[key]
        }
      }
      if (isArray(fieldSpec) && 'array' === fieldSpec[0]) { // many-to-one
        form.setuInstance[relatedAs].push(copyInstance)
      } else { // one-to-one
        form.setuInstance[relatedAs] = copyInstance
      }
    }

    function _post_meta_reset_model_form(form, relatedForms) {
      if (form.hasAttribute(__meta_attr_model__)) {
        // need to create a new instance now
        _post_meta_reset_form_instance(form)
        // reset related forms
        for (var idx = 0; idx < relatedForms.length; ++idx) {
          var relatedForm = relatedForms[idx]
          if (relatedForm.hasAttribute(__meta_attr_model__)) {
            _post_meta_reset_form_instance(relatedForm)
          }
        }
      }
    }

    function _post_meta_reset_form_instance(form) {
      form.setuInstance = models_create_instance(form.setuInstance.__model)
    }

    function post_meta_process() {
      console.debug('Setu.post-meta @')
      console.time('post-meta-process')
      _post_meta_setup_route_links()
      console.debug('Setu.post-meta $ process')
      console.timeEnd('post-meta-process')
    }

    function _post_meta_setup_route_links() {
      SetuAppElement.querySelectorAll('a[href]').forEach(function(link) {
        if (link.setuLink) {
          return true
        }
        var path = link.getAttribute('href').replace(/\?.*$/, '')
        if (SetuRoutes[path]) {
          $_(link).onclick(function(e) {
            if (e.preventDefault) e.preventDefault()
            if (e.stopPropagation) e.stopPropagation()
            console.debug('Setu.application navigating in-browser', link.getAttribute('href'))
            application_open(link.getAttribute('href'))
            return false
          })
          console.debug('Setu.post-meta $ link', link)
        }
        link.setuLink = true
      })
    }

    var SetuBinds = {},
      SetuBindQueue = [],
      SetuProcessing = false

    events_register(__event_list_resource_create__, _binds_on_list_create)

    function binds_clear() {
      SetuBinds = {}
      SetuBindQueue = []
      SetuProcessing = false
      console.debug('Setu.binds x all')
    }

    function binds_setup(element) {
      if (element.setuBind) {
        return true
      }
      var setu = element.setu
      if (!setu) {
        console_error('Setu.binds', 'internal programming error with binds', element)
        return
      }
      console.debug('Setu.binds @ +', element, setu, SetuBinds)
      var required = meta_parse_bind(element)
      required.forEach(function(resource) {
        var req = resource.key
        SetuBinds[req] = SetuBinds[req] || {}
        if (!SetuBinds[req][setu.key]) {
          SetuBinds[req][setu.key] = element
          if (1 === Object.keys(SetuBinds[req]).length) {
            if (__keyword_detail__ === resource.type) {
              events_register_from(__event_detail_resource_change__, req, _binds_on_detail_change, ns)
            } else if (__keyword_list__ === resource.type) {
              events_register_from(__event_list_resource_change__, req, _binds_on_list_change, ns)
            }
          }
          console.debug('Setu.binds +', req, setu)
        }
      })
      events_register_from(__event_before_element_delete__, setu.key, _binds_before_element_delete, ns)
      element.setuBind = true
      console.debug('Setu.binds $ +', element, setu, SetuBinds)
    }

    function _binds_before_element_delete(ignored, element) {
      var setu = element.setu
      console.debug('Setu.binds @ x', element, setu, SetuBinds)
      var required = meta_parse_bind(element)
      required.forEach(function(resource) {
        var req = resource.key
        if (SetuBinds[req][setu.key]) {
          delete SetuBinds[req][setu.key]
          if (0 === Object.keys(SetuBinds[req]).length) {
            if (__keyword_detail__ === resource.type) {
              events_unregister_from(__event_detail_resource_change__, req, ns)
            } else
            if (__keyword_list__ === resource.type) {
              events_unregister_from(__event_list_resource_change__, req, ns)
            }
          }
          console.debug('Setu.binds x', req, element)
        }
      })
      events_unregister_from(__event_before_element_delete__, setu.key, ns)
      console.debug('Setu.binds $ x', element, setu, SetuBinds)
    }

    function _binds_on_detail_change(ignored, resource, data) {
      console.debug('Setu.binds @ detail-change', resource, data)
      if (_binds_handle_queuing(_binds_on_detail_change, ignored, resource, data)) {
        return
      }
      var key = data.key
      var field = data.field
      if (!SetuBinds[key]) {
        console.debug('Setu.binds $ detail-change', resource, data)
        _binds_end_processing()
        return
      }
      var bound = SetuBinds[key] ? Object.keys(SetuBinds[key]).slice() : []
      var toChange = []
      bound.forEach(function(setuKey) {
        var element = SetuBinds[key][setuKey]
        var re = new RegExp("\\." + field + "[^a-zA-Z0-9_]", 'g')
        console.debug('Setu.binds', element.setu.key, element.setu.template, re)
        if (element.setu.template.match(re)) {
          toChange.push(setuKey)
        }
      })
      if (!toChange.length) {
        console.debug('Setu.binds $ detail-change no updates needed', data)
        _binds_end_processing()
        return
      }
      _binds_eval_again(key, toChange)
      _binds_end_processing()
      console.debug('Setu.binds $ detail-change', resource, data)
    }

    function _binds_on_list_create(ignored, resource) {
      console.debug('Setu.binds @ list-create', resource)
      var key = resource.key
      var bound = SetuBinds[key] ? Object.keys(SetuBinds[key]).slice() : []
      if (!bound.length) {
        parser_unhide(resource.title || resources_get_generic_title(resource))
        console.debug('Setu.binds $ list-create did unhide as nothing was bound', resource)
      } else {
        _binds_eval_again(key, bound)
        console.debug('Setu.binds $ list-create', resource, data)
      }
    }

    function _binds_on_list_change(ignored, resource) {
      console.debug('Setu.binds @ list-change', resource)
      var key = resource.key
      if (!SetuBinds[key]) {
        return
      }
      var bound = SetuBinds[key] ? Object.keys(SetuBinds[key]).slice() : []
      _binds_eval_again(key, bound)
      console.debug('Setu.binds $ list-change', resource)
    }

    function _binds_eval_again(key, bound) {
      bound.forEach(function(setuKey) {
        var element = SetuBinds[key][setuKey]
        scopes_clone_sibling_with_template(element)
        scopes_remove(element)
      })
    }

    function _binds_handle_queuing(called, ignored, resource, data) {
      if (!SetuProcessing) {
        SetuProcessing = true
        console.group()
        return false
      } else {
        SetuBindQueue.push([called, ignored, resource, data])
        console.debug('Setu.binds Q', called, ignored, resource, data)
        return true
      }
    }

    function _binds_end_processing() {
      SetuProcessing = false
      console.groupEnd()
      var details = SetuBindQueue.shift()
      if (details) {
        details[0](details[1], details[2], details[3])
      }
    }

    var SetuRoutes,
      SetuCurrentRoute,
      SetuCurrentPath

    function routes_setup(routes) {
      SetuRoutes = routes
      routes_reset()
    }

    function routes_resolve(success) {
      if (SetuHistoryChange && SetuHistoryChange.path) {
        SetuCurrentPath = SetuHistoryChange.path.replace(/\?.*$/, '')
        SetuHistoryChange = null
        console.debug('Setu.routes popstate', SetuCurrentPath)
      } else {
        SetuCurrentPath = location.pathname
        console.debug('Setu.routes location', SetuCurrentPath)
      }
      if (!SetuRoutes[SetuCurrentPath]) {
        /*console_error('Setu.routes ! no definition for', SetuCurrentPath)
        throw new Error(__badly_configured_msg__)*/
        SetuCurrentRoute = {}
        success()
        return
      }
      var routeSpec = SetuRoutes[SetuCurrentPath]
      if ('function' === typeof(routeSpec)) {
        routeSpec(function(ret) {
          SetuCurrentRoute = ret
          console.debug('Setu.routes $ resolve', SetuCurrentPath, SetuCurrentRoute)
          success()
        })
      } else {
        SetuCurrentRoute = routeSpec
        console.debug('Setu.routes $ resolve', SetuCurrentPath, SetuCurrentRoute)
        success()
      }
    }

    function routes_reset() {
      SetuCurrentRoute = SetuCurrentPath = undefined
      console.debug('Setu.routes x all')
    }

    var SetuHistoryChange

    history.pushState({
        path: location.pathname + location.search
      },
      '',
      location.pathname + location.search)

    window.onpopstate = function(event) {
      if (event.state && event.state.path) {
        SetuHistoryChange = event.state
        application_navigate()
      }
    }

    function history_push(path) {
      history.pushState({
        path: path
      }, '', path)
    }

    function history_replace(path) {
      history.replaceState({
        path: path
      }, '', path)
    }

    var SetuAdditionsObserver = new MutationObserver(function(mutations) {
      _observer_process_added(mutations)
    })

    function observer_monitor_additions() {
      if (SetuAppElement && SetuAppElement.parentNode) {
        SetuAdditionsObserver.observe(SetuAppElement, {
          childList: true,
          subtree: true
        })
      }
    }

    function observer_forego_additions() {
      SetuAdditionsObserver.disconnect()
    }

    function _observer_process_added(mutations) {
      var gotNew = false
      mutations.forEach(function(m) {
        if (m.addedNodes && m.addedNodes.length) {
          for (var idx = 0; idx < m.addedNodes.length; ++idx) {
            var node = m.addedNodes[idx]
            if (__dom_node_type_element__ == node.nodeType && meta_is_scope(node)) {
              SetuParserQueue.push(node)
              node.setuQueued = true
              gotNew = true
              console.debug('Setu.observer +', node)
            }
          }
        }
      })
      if (!SetuParserRunning && gotNew) {
        parser_run()
      }
    }

    var SetuViews

    function views_setup(views) {
      SetuViews = views
    }

    function views_setup_click(element) {
      if (element.setuClick) {
        return
      }
      var viewDetail = meta_parse_click(element)
      if (null === viewDetail) {
        console_error('Setu.views ! invalid setu-click', element.getAttribute(__meta_attr_click__), element)
        throw new Error(__invalid_meta_msg__)
      }
      switch (viewDetail.type) {
        case __keyword_detail__:
        case __keyword_update__:
          _view_setup_instance_click(element, viewDetail)
          console.debug('Setu.views + click handler', viewDetail.type, element)
          break
        case __keyword_create__:
        case __keyword_list__:
          _view_setup_model_click(element, viewDetail)
          console.debug('Setu.views + click handler', viewDetail.type, element)
          break
        case 'generic':
          element.onclick = function(e) {
            if (e.preventDefault) e.preventDefault()
            if (e.stopPropagation) e.stopPropagation()
            eval(viewDetail.code)
          }
          element.setuClick = true
          break
      }
    }

    function _view_setup_instance_click(element, viewDetail) {
      var setu = element.setu
      if (!setu) {
        console_error('Setu.views ! internal programming error blocked processing setu-click', element)
        return
      }
      var context = setu.needed[setu.contextKey]
      if (!context) {
        console_error('Setu.views ! setu-click specified on an element for which no instance context can be found', element)
        throw new Error(__invalid_meta_msg__)
      }
      var modelName = context.__model.name
      if (SetuViews[modelName] && SetuViews[modelName][viewDetail.type]) {
        var user_function = _views_setup_part_one(element, modelName, viewDetail)
        viewDetail.instance = context
        _views_setup_part_two(element, viewDetail, user_function)
      }
    }

    function _view_setup_model_click(element, viewDetail) {
      var modelName = viewDetail.modelName
      if (SetuViews[modelName] && SetuViews[modelName][viewDetail.type]) {
        var user_function = _views_setup_part_one(element, modelName, viewDetail)
        _views_setup_part_two(element, viewDetail, user_function)
      }
    }

    function _views_setup_part_one(element, modelName, viewDetail) {
      var user_function = SetuViews[modelName][viewDetail.type]
      if ('function' !== typeof(user_function)) {
        console_error('Setu.views ! not a view function', modelName, viewDetail.type, user_function)
        throw new Error(__badly_configured_msg__)
      }
      viewDetail.passed = element.getAttribute(__meta_attr_pass__)
      viewDetail.origin = element
      return user_function
    }

    function _views_setup_part_two(element, viewDetail, user_function) {
      $_(element).onclick(function(e) {
        if (e.preventDefault) e.preventDefault()
        if (e.stopPropagation) e.stopPropagation()
        user_function(viewDetail)
      })
      element.setuClick = true
    }

    var SetuConfig

    function config_setup(config) {
      SetuConfig = config
      if (SetuConfig.logLevel) {
        log_set_level(SetuConfig.logLevel)
      }
      if (SetuConfig.adapters) {
        SetuConfig.adapters.forEach(function(adapterGroup) {
          ns.adapters[adapterGroup].forEach(function(adapter) {
            adapters_register(adapter.purpose, adapter.handler)
          })
        })
      }
      console.debug('Setu.config $ setup')
    }

    function config_get_flush_on_change() {
      if (SetuConfig.pathchange && SetuConfig.pathchange.flush) {
        return SetuConfig.pathchange.flush
      }
      return undefined
    }

    var SetuAppElement = document.querySelector('[setu-app]'),
      SetuAppEnd,
      SetuAppName

    if (!SetuAppElement) {
      console.error('Setu.application', 'no element with setu-app attribute defined')
      throw new TypeError(__badly_configured_msg__)
    }

    function _application_run(name, settings) {
      console.debug('Setu.application running...')
      SetuAppName = name
      config_setup(settings.config || {})
      routes_setup(settings.routes || {})
      models_setup(settings.models, settings.modelFilters, settings.config && settings.config.models)
      resources_setup(settings.resources || {})
      views_setup(settings.views || {})
      application_navigate()
    }

    function application_refresh() {
      console.debug('Setu.application refreshing...')
      _application_flush()
      application_navigate()
    }

    function application_open(url) {
      console.debug('Setu.application opening', url)
      history_push(url)
      application_navigate()
    }

    function _application_redirect(url) {
      console.debug('Setu.application redirecting (in-browser) to', url)
      history_replace(url)
      application_navigate()
    }

    function application_navigate() {
      console.time('navigate')
      _application_clear()
      events_fire('PageBegin', ns)
      _application_resolve_n_execute()
      console.timeEnd('navigate')
    }

    function _application_clear() {
      console.time('app-clear')
      var toFlush = config_get_flush_on_change()
      for (var key in toFlush) {
        switch (key) {
          case 'resources':
            toFlush[key].forEach(function(r) {
              resources_flush(r)
            })
            break
        }
      }
      routes_reset()
      parser_clear()
      binds_clear()
      evals_clear()
      if (SetuAppEnd) {
        var last = SetuAppEnd.previousElementSibling
        while (last) {
          var rem = last
          last = last.previousElementSibling
          rem.remove()
        }
        SetuAppEnd = undefined
      }
      console.debug('Setu.application clean slate')
      console.timeEnd('app-clear')
    }

    function _application_resolve_n_execute() {
      console.time('resolve-n-execute')
      routes_resolve(
        function() {
          if (SetuCurrentRoute.redirect) {
            _application_redirect(SetuCurrentRoute.redirect)
            console.timeEnd('resolve-n-execute')
          } else if (SetuCurrentRoute.include) {
            console.debug('Setu.application page rendering needs', SetuCurrentRoute.include)
            var queryparams = {}
            if (location.search) {
              var querystring = location.search.replace(/^\?/, '')
              var params = querystring.split('&')
              params.forEach(function(param) {
                var pair = param.split('=')
                queryparams[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
              })
            }
            evals_set('queryparams', queryparams)
            if (SetuCurrentRoute.flush) {
              _application_flush()
            }
            var required = SetuCurrentRoute.require || []
            resources_get(required, {},
              function(resources) {
                evals_add(resources)
                observer_monitor_additions()
                _application_load_html()
                console.timeEnd('resolve-n-execute')
              })
          } else {
            observer_monitor_additions()
            SetuAppElement.querySelectorAll(__meta_attribs_selector__).forEach(function(element) {
              SetuParserQueue.push(element)
              element.setuQueued = true
            })
            parser_run()
            console.timeEnd('resolve-n-execute')
            /*console_error('Setu.application', SetuCurrentPath, 'invalid specification', SetuCurrentRoute)
            throw new TypeError(__badly_configured_msg__)*/
          }
        })
    }

    function _application_load_html() {
      GET(SetuCurrentRoute.include, {}, function(response) {
        SetuAppEnd = SetuAppElement.firstElementChild
        if (SetuAppEnd) {
          $_(SetuAppEnd).before(response.data)
        } else {
          $_(SetuAppElement).append(response.data)
        }
        if (!SetuAppElement.querySelectorAll(__meta_attribs_selector__).length) {
          parser_post_run()
        }
      })
    }

    function _application_flush() {
      resources_flush_all()
      console.debug('Setu.application flushed all resources')
    }

    ns.run = _application_run
    ns.refresh = application_refresh
    ns.open = application_open

    ns.clear = function() {
      parser_clear()
    }

    ns.app = SetuAppElement

  }(window.Setu = window.Setu || {}))

$_.ready(function() {
  Setu.adapters['Django'] = [{
    purpose: 'ajax.beforeSend',
    handler: function(ignore, xhr, options, context) {
      if (!/^(GET|HEAD|OPTIONS|TRACE)$/.test(options.method) && !context.crossDomain) {
        var csrfToken = document.cookie.match(new RegExp('csrftoken=([^;]+)'));
        if (csrfToken) {
          xhr.setRequestHeader('X-CSRFToken', csrfToken[1])
          console.debug('DjangoAdapter', 'added X-CSRFToken header', csrfToken[1])
        }
      }
    }
  }]
})

$_.ready(function() {
  Setu.adapters['DjangoRestFramework'] = [{
    purpose: 'models.listOutput',
    handler: function(ignore, response) {
      function isArray(v) {
        return ('[object Array]' === Object.prototype.toString.call(v))
      }

      function isObject(v) {
        return ('object' === typeof(v) && !isArray(v))
      }
      var data = response.data
      if (isObject(data)) {
        window.SetuExtras = window.SetuExtras || {}
        window.SetuExtras.paginationData = {
          available: data.count,
          next: data.next,
          previous: data.previous
        }
        return data.results
      } else if (isArray(data)) {
        return data
      }
    }
  }]
})