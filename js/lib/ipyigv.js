const widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var igv = require('./igv.js')

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.


export class TrackModel extends widgets.WidgetModel {
  defaults () {
      return _.extend(super.defaults(),  {
            _model_name : 'TrackModel',
            _view_name : 'TrackView',
            _model_module : 'ipyigv',
            _view_module : 'ipyigv',
            _model_module_version : '0.1.0',
            _view_module_version : '0.1.0',
        });
    };
  };


export class ReferenceGenomeModel extends widgets.WidgetModel {
  defaults () {
      return _.extend(super.defaults(),  {
        _model_name : 'ReferenceGenomeModel',
        _view_name : 'ReferenceGenomeView',
        _model_module : 'ipyigv',
        _view_module : 'ipyigv',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
      });
    };
};

ReferenceGenomeModel.serializers = _.extend({
  tracks: { deserialize: widgets.unpack_models }
  },
  widgets.WidgetModel.serializers
)

export class IgvModel extends widgets.DOMWidgetModel {
    defaults () {
      return _.extend(super.defaults(),  {
          _model_name : 'IgvModel',
          _view_name : 'IgvBrowser',
          _model_module : 'ipyigv',
          _view_module : 'ipyigv',
          _model_module_version : '0.1.0',
          _view_module_version : '0.1.0',
      });
    };
};

IgvModel.serializers = _.extend({
    genome: { deserialize: widgets.unpack_models },
    tracks: { deserialize: widgets.unpack_models },
  },
  widgets.DOMWidgetModel.serializers
)

export class ReferenceGenomeView extends widgets.WidgetView {
  render () {
    super.render();
    console.log("rendering ReferenceGenomeView");
  }
}

export class TrackView extends widgets.WidgetView {
  render () {
    super.render();
    console.log("rendering TrackView");
  }
}


export class IgvBrowser extends widgets.DOMWidgetView {
    initialize(options) {
        super.initialize(options);
        this.tracks_initialized = true;
        this.browser = null;
        this.track_views = new widgets.ViewList(this.add_track_view, this.remove_track_view, this);
        console.log("configuring track_views");
        this.track_views.update(this.model.get('tracks'));
        this.tracks_initialized = true;
        console.log("Done configuring track_views");
    }

    render() {
      super.render();

      console.log("rendering browser");
      this.igvDiv = document.createElement("div");
      var referenceGenome = this.model.get('genome');
      var options =  {reference: referenceGenome};
      this.browser = igv.createBrowser(this.igvDiv, options)
        .then((browser) => {
            console.log("Created IGV browser with options ", options);
            browser.on('trackremoved', this.track_removed);
            browser.on('trackdragend', this.track_dragged);

            browser.on('locuschange', this.locus_changed);
            browser.on('trackclick', this.track_clicked);
            return browser;
          });

      this.el.appendChild(this.igvDiv);


      this.listenTo(this.model, 'change:genome', this.update_genome, this);
      this.listenTo(this.model, 'change:tracks', this.update_tracks, this.reference);

    }

    update_genome () {
      var genome = this.model.get('genome');
      console.log('Updating browser reference with ', genome);
      this.browser.then((b) => {
        b.loadGenome(genome);
      });
    }

    update_tracks () {
      console.log("update_tracks")
      if (this.tracks_initialized) {
        var tracks = this.model.get('tracks');
        console.log('Updating tracks_views with ', tracks);
        this.track_views.update(tracks);
      }
      else {
        console.log ("tracks not yet initialized - skipping");
      }
    }

    add_track_view (child_model) {
      return this.create_child_view(child_model, {}).then(view => {
          console.log('add_track_view with child :', child_model);
          if (this.tracks_initialized) {
              return this.browser.then((browser) => {
                  return browser.loadTrack(child_model.attributes).then((newTrack) => {
                      console.log("new track loaded in browser: " , newTrack);
                      return view;
                  });
            });
          } else {
              console.log("track_view not yet initialized, skipping");
              return view;
          }
      });
    }

    remove_track_view (child_view) {
      console.log('removing Track from genome', child_view);

      if (!this.tracks_initialized) {
        console.log("track_view not yet initialized, skipping");
        return;
      }

      this.browser.then(b => {
          b.removeTrackByName(child_view.model.get("name"));
      });
    }

    track_removed (tracks) {
      console.log('track removed', tracks);
    }

    track_dragged (arg) {
      console.log('track dragged', arg);
    }

    locus_changed (referenceFrame, label) {
      console.log('locus changed', referenceFrame, label);
    }

    track_clicked (track, popoverData) {
      console.log('track clicked', track, popoverData);
    }
}

// module.exports = {
//     IgvModel: IgvModel,
//     IgvBrowser: IgvBrowser,
//     ReferenceGenomeView: ReferenceGenomeView,
//     ReferenceGenomeModel: ReferenceGenomeModel,
//     TrackView: TrackView,
//     TrackModel: TrackModel,
// };
