const mongoose = require('mongoose');
const { withPageAssets } = require('../lib/pageAssets');
const Cycle = require('../models/Cycle');
const cycleService = require('../services/cycleService');
const cycleGenerationService = require('../services/cycleGenerationService');
const editalFileService = require('../services/editalFileService');

exports.index = async (req, res, next) => {
  try {
    const { cycles, activeCycle } = await cycleService.listCycles(req.user._id);
    res.render('cycles/index', {
      title: 'Meus Ciclos',
      currentPage: 'cycles',
      cycles,
      activeCycle
    });
  } catch (err) {
    next(err);
  }
};

exports.getCreate = (req, res) => {
  res.render('cycles/create', withPageAssets({
    title: 'Criar Ciclo',
    currentPage: 'cycles',
    error: null
  }, {
    pageScripts: ['/js/pages/cycle-form.js', '/js/pages/cycle-ai.js']
  }));
};

exports.create = async (req, res, next) => {
  try {
    const result = await cycleService.createCycle(req.user._id, req.body);
    if (result.error) {
      return res.render('cycles/create', withPageAssets({
        title: 'Criar Ciclo',
        currentPage: 'cycles',
        error: result.error
      }, {
        pageScripts: ['/js/pages/cycle-form.js', '/js/pages/cycle-ai.js']
      }));
    }

    return res.redirect('/cycles');
  } catch (err) {
    return next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect('/cycles');
    }

    const detail = await cycleService.getCycleDetail(req.user._id, req.params.id);
    if (!detail) {
      return res.redirect('/cycles');
    }

    return res.render('cycles/show', {
      title: detail.cycle.name,
      currentPage: 'cycles',
      cycle: detail.cycle,
      cycleDays: detail.cycleDays
    });
  } catch (err) {
    return next(err);
  }
};

exports.getEdit = async (req, res, next) => {
  try {
    const cycle = await Cycle.findOne({ _id: req.params.id, userId: req.user._id });
    if (!cycle) return res.redirect('/cycles');

    return res.render('cycles/edit', withPageAssets({
      title: 'Editar Ciclo',
      currentPage: 'cycles',
      cycle,
      error: null
    }, {
      pageScripts: ['/js/pages/cycle-form.js']
    }));
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await cycleService.updateCycle(req.user._id, req.params.id, req.body);
    if (!result.cycle) return res.redirect('/cycles');

    if (result.error) {
      return res.render('cycles/edit', withPageAssets({
        title: 'Editar Ciclo',
        currentPage: 'cycles',
        cycle: result.cycle,
        error: result.error
      }, {
        pageScripts: ['/js/pages/cycle-form.js']
      }));
    }

    return res.redirect('/cycles');
  } catch (err) {
    return next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    await cycleService.deleteCycle(req.user._id, req.params.id);
    res.redirect('/cycles');
  } catch (err) {
    next(err);
  }
};

exports.activate = async (req, res, next) => {
  try {
    const cycle = await cycleService.activateCycle(req.user._id, req.params.id);
    if (!cycle) return res.redirect('/cycles');

    return res.redirect('/dashboard');
  } catch (err) {
    return next(err);
  }
};

exports.generateWithAI = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (req.file) {
      try {
        const extracted = await editalFileService.extractTextFromUpload(req.file);
        const manual = typeof payload.editalText === 'string' ? payload.editalText.trim() : '';
        payload.editalText = [extracted, manual].filter(Boolean).join('\n\n---\n\n');
      } catch (parseErr) {
        return res.status(400).json({
          success: false,
          error: parseErr.message || 'Nao foi possivel ler o arquivo do edital.'
        });
      }
    }

    const result = await cycleGenerationService.generateAndPersistCycle(req.user._id, payload);
    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details || null
      });
    }

    return res.status(201).json({
      success: true,
      source: result.source,
      cycle: result.cycle,
      days: result.cycleDays,
      plan: result.plan
    });
  } catch (err) {
    return next(err);
  }
};
