import { trackDBQuery } from '../config/monitoring.js';

const mongoosePlugin = (schema) => {
  schema.pre('save', function() {
    const startTime = Date.now();
    this._queryStartTime = startTime;
  });

  schema.post('save', function() {
    const duration = (Date.now() - this._queryStartTime) / 1000;
    trackDBQuery('save', this.collection.name, duration);
  });

  ['find', 'findOne', 'update', 'delete'].forEach(operation => {
    schema.pre(operation, function() {
      this._queryStartTime = Date.now();
    });

    schema.post(operation, function() {
      const duration = (Date.now() - this._queryStartTime) / 1000;
      trackDBQuery(operation, this.model.collection.name, duration);
    });
  });
};

export default mongoosePlugin;