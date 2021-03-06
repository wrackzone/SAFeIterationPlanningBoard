(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * @private
     * Should this be in rui?
     */
    Ext.define('Rally.apps.iterationplanningboard.IterationPlanningBoardBacklogColumn', {
        extend: 'Rally.ui.cardboard.Column',
        alias: 'widget.iterationplanningboardappbacklogcolumn',

        cls: 'column',

        requires: [
            'Rally.ui.TextField'
        ],

        mixins: {
            maskable: 'Rally.ui.mask.Maskable'
        },

        config: {
            value: null,
            release: null
        },

        getColumnStatus: function() {
            return this.columnStatus;
        },

        getStatusCell: function() {
            return Ext.get(this.statusCell);
        },

        drawHeader: function() {
            this.callParent(arguments);

            //this.getColumnHeader().add(
                //{
                    //xtype: 'container',
                    //cls: 'search',
                    //items: [
                        //{
                            //xtype: 'rallytextfield',
                            //cls: 'search-text',
                            //itemId: 'searchText',
                            //enableKeyEvents: true,
                            //emptyText: 'Search',
                            //listeners: {
                                //specialkey: this._onSearchTextSpecialKey,
                                //scope: this
                            //}
                        //},
                        //{
                            //xtype: 'component',
                            //cls: 'search-button',
                            //listeners: {
                                //click: {
                                    //element: 'el',
                                    //fn: this._onSearchClicked,
                                    //scope: this
                                //}
                            //}
                        //}
                    //]
                //}
            //);
        },

        initComponent: function() {
            this.callParent(arguments);

            console.log('release', this.release);
            this.on('afterrender', function() {
                var cls = 'planning-column backlog';
                this.getContentCell().addCls(cls);
                this.getStatusCell().addCls(cls);
                this.getColumnHeaderCell().addCls(cls);
            }, this, {single: true});

            this.on('beforecarddroppedsave', this._onBeforeCardDrop, this);
        },

        _onSearchClicked: function() {
            this._refreshColumn();
        },

        _onSearchTextSpecialKey: function(searchTextField, e) {
            if (e.getKey() === e.ENTER) {
                this._refreshColumn();
            }
        },

        _refreshColumn: function() {
            if (this.searching) {
                return;
            }

            this.searching = true;
            var searchValue = this.getColumnHeader().down('#searchText').getValue();
            this.setMaskTarget(this.getContentCell());
            this.showMask();
            this._deactivatedCards = [];

            this.on('load', function() {
                this.fireEvent('filter', this);
                this.hideMask();
                this.searching = false;
            }, this, {single: true});

            this.refresh({
                storeConfig: {
                    search: searchValue ? Ext.String.trim(searchValue) : ""
                }
            });
        },

        getStoreFilter: function(model) {
            var app = Ext.ComponentQuery.query('#app')[0];
            var filters = [];
            var featureName = 'Feature';
            var tb;
            var release;

            this.storeConfig.filters = [];

            if (app) {
              tb = app.getContext().getTimeboxScope();
            }
            if (tb) {
                release = tb.getRecord();
            }
            if (app && app.featureName) {
              featureName = app.featureName;
            }

            Ext.Array.push(filters, this.callParent(arguments));
            if (model.elementName === 'HierarchicalRequirement') {
                if (this.context.getSubscription().StoryHierarchyEnabled) {
                    filters.push({
                        property: 'DirectChildrenCount',
                        value: 0
                    });

                    if (release) {
                        filters.push({
                          property: featureName + '.Release.ReleaseStartDate',
                          operator: '>=',
                          value: release.raw.ReleaseStartDate
                        });
                        filters.push({
                          property: featureName + '.Release.ReleaseDate',
                          operator: '<=',
                          value: release.raw.ReleaseDate
                        });
                    }
                }
            } else if (model.elementName === 'Defect') {
                Ext.Array.push(filters,
                    {
                        property: 'Requirement',
                        value: null
                    },
                    {
                        property: 'State',
                        operator: '!=',
                        value: 'Closed'
                    });
            }

            return filters;
        },

        isMatchingRecord: function(record) {
            var isMatching = this.callParent(arguments);
            if (record.self.elementName === 'HierarchicalRequirement') {
                isMatching = isMatching && (!record.hasField('DirectChildrenCount') || record.get('DirectChildrenCount') === 0);
            } else if (record.self.elementName === 'Defect') {
                isMatching = isMatching && (!record.hasField('Requirement') || !record.get('Requirement'));
            }
            return isMatching;
        },

        _onBeforeCardDrop: function(column, card) {
            card.getRecord().set('Release', null);
        }
    });
})();
