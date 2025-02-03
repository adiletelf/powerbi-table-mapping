/*
 *  Power BI Visualizations
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

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import powerbi from "powerbi-visuals-api";
import DataViewTableRow = powerbi.DataViewTableRow;

import { LegendDataPoint } from "./visual";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { Group, SimpleSlice } from "powerbi-visuals-utils-formattingmodel/lib/FormattingSettingsComponents";
import ISelectionId = powerbi.visuals.ISelectionId;
import SimpleCard = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import FormattingSettingsModel = formattingSettings.Model;


export class LegendCard extends SimpleCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        value: true,
    });

    name = "legend";
    displayName = "Legend";
    slices: SimpleSlice[] = [this.show];
}

export class MilestoneCard extends CompositeCard {
    name = "milestone";
    displayName = "Milestone";
    groups = [];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    legend = new LegendCard();
    milestones = new MilestoneCard();

    cards = [this.legend, this.milestones];

    public populateMilestones(milestones: LegendDataPoint[]) {
        if (!milestones || milestones.length === 0) {
            return;
        }

        const milestoneGroups = [];

        milestones.forEach((milestone: LegendDataPoint) => {
            if (!milestone || !milestone.name) {
                return;
            }

            const colorPicker = new formattingSettings.ColorPicker({
                name: "fill",
                displayName: milestone.name,
                value: { value: milestone.color },
                selector: ColorHelper.normalizeSelector(milestone.identity.getSelector(), false),
            });

            const newGroup = new Group({
                name: milestone.name,
                displayName: milestone.name,
                slices: [colorPicker],
            })

            milestoneGroups.push(newGroup);
        });

        this.milestones.groups = milestoneGroups;
    }
}
