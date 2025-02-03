/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import ISelectionId = powerbi.visuals.ISelectionId;

import DataView = powerbi.DataView;
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import IColorPalette = powerbi.extensibility.IColorPalette;

import { VisualFormattingSettingsModel } from "./settings";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { ValueFormatterOptions } from "powerbi-visuals-utils-formattingutils/lib/src/valueFormatter";

export interface LegendDataPoint {
    name: string;
    color: string;
    identity: ISelectionId;
}

const LegendPropertyIdentifier: DataViewObjectPropertyIdentifier = {
    objectName: "legend",
    propertyName: "fill"
};

const MilestonePropertyIdentifier: DataViewObjectPropertyIdentifier = {
    objectName: "milestone",
    propertyName: "fill"
};

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private dataView: DataView;
    private colors: IColorPalette;
    private legendDataPoints: LegendDataPoint[];
    private milestones: LegendDataPoint[];

    private milestoneMap = {};

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.host = options.host;
        this.colors = options.host.colorPalette;
    }

    public update(options: VisualUpdateOptions) {
        try {
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);
            this.dataView = options.dataViews[0];

            this.target.replaceChildren();

            const milestoneColorHelper = new ColorHelper(this.colors, MilestonePropertyIdentifier);
            this.milestones = this.dataView.matrix.columns.root.children.map((column: DataViewMatrixNode, index: number) => {
                const milestone = column.value.toString();

                const color = milestoneColorHelper.getColorForMeasure(column.objects, milestone);
                const identity = this.host.createSelectionIdBuilder()
                    .withMatrixNode(column, this.dataView.matrix.rows.levels)
                    .createSelectionId();

                const legendDataPoint: LegendDataPoint = {
                    name: milestone,
                    color: color,
                    identity: identity,
                };

                this.milestoneMap[milestone] = index;
                this.milestoneMap[index] = milestone;

                const p = document.createElement("p");
                p.textContent = milestone;
                p.style.color = color;
                this.target.appendChild(p);

                return legendDataPoint;
            });

            this.dataView.matrix.rows.root.children.forEach((row: DataViewMatrixNode) => {
                const taskName = row.value.toString();
                // const value = row.values[0]?.value?.toString() || 'N/A';
                const columnIndex = Object.values(row.values).findIndex(obj => obj.value != null);
                const milestoneName = this.milestoneMap[columnIndex];
                const color = !!milestoneName
                    ? milestoneColorHelper.getColorForMeasure(this.dataView.matrix.columns.root[columnIndex], milestoneName)
                    : "black";

                const value = !!milestoneName
                    ? 'N/A'
                    : row.values[columnIndex].value.toString();

                const p = document.createElement("p");
                p.textContent = `${taskName}: ${value}`;
                p.style.color = color;
                this.target.appendChild(p);
            });
            
            const formatterOptions: ValueFormatterOptions = {
                value: 1000,
                precision: 1,
                cultureSelector: "de-CH",
            };

            const formatter = valueFormatter.create(formatterOptions);
            const value = formatter.format(2500);
            console.log(value);

        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        if (this.milestones?.length > 0) {
            this.formattingSettings.populateMilestones(this.milestones);
        }

        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}