(function () {
    var defaults = {
        sWaH: 106,
        CrH: 26,
        HiC: 97,
        WaC: 72,
        CrL: null,
        KnH: null,
        ThC: 55.5,
        HEM: 42,
        BuA: 82
    };

    var dlg = new Window('dialog', 'Enter Measurements (Default: Size 38)');
    dlg.alignChildren = 'left';
    var measGroup = dlg.add('panel', undefined, 'Measurements (cm)');
    measGroup.orientation = 'row';
    measGroup.alignChildren = 'top';

    function addFieldTo(container, label, def, opts) {
        var g = container.add('group');
        g.alignChildren = ['left', 'center'];
        var st = g.add('statictext', undefined, label + ':');
        var f = g.add('edittext', undefined, def !== null ? def : '');
        f.characters = 8;

        if (opts && opts.helpTip) {
            g.helpTip = opts.helpTip;
            try { st.helpTip = opts.helpTip; } catch (eStTip) {}
            try { f.helpTip = ''; } catch (eFieldTip) {}
        }

        return f;
    }

    var mandatoryPanel = measGroup.add('panel', undefined, 'Mandatory');
    mandatoryPanel.orientation = 'column';
    mandatoryPanel.alignChildren = 'left';

    var optionalPanel = measGroup.add('panel', undefined, 'Optional');
    optionalPanel.orientation = 'column';
    optionalPanel.alignChildren = 'left';

    function addMandatoryField(label, def, opts) {
        return addFieldTo(mandatoryPanel, label, def, opts);
    }

    function addOptionalField(label, def, opts) {
        return addFieldTo(optionalPanel, label, def, opts);
    }
    function __lineIntersection(originA, dirA, originB, dirB) {
        var det = dirA[0]*dirB[1] - dirA[1]*dirB[0];
        if (Math.abs(det) < 1e-6) return null;
        var diffX = originB[0] - originA[0];
        var diffY = originB[1] - originA[1];
        var t = (diffX*dirB[1] - diffY*dirB[0]) / det;
        return [ originA[0] + dirA[0]*t, originA[1] + dirA[1]*t ];
    }

    // Mandatory measurements
    var fsWaH = addMandatoryField('1. sWaH', defaults.sWaH);
    var fWaC = addMandatoryField('2. WaC', defaults.WaC);
    var fHiC = addMandatoryField('3. HiC', defaults.HiC);
    var fCrH = addMandatoryField('4. CrH', defaults.CrH);

    var hemGroup = mandatoryPanel.add('group');
    hemGroup.add('statictext', undefined, 'HEM:');
    var hemValues = [];
    for (var h = 40; h <= 48; h++) hemValues.push(h.toString());
    hemValues.push('Other');
    var hemDropdown = hemGroup.add('dropdownlist', undefined, hemValues);

    // ExtendScript may not support Array.prototype.indexOf reliably
    var defaultIndex = -1;
    for (var di = 0; di < hemValues.length; di++) {
        if (hemValues[di] === String(defaults.HEM)) { defaultIndex = di; break; }
    }
    hemDropdown.selection = defaultIndex >= 0 ? defaultIndex : 0;

    hemDropdown.onChange = function () {
        if (hemDropdown.selection.text === 'Other') {
            var custom = prompt('Enter custom Hem Width in cm:', defaults.HEM);
            if (custom !== null) {
                var val = parseFloat(custom);
                if (!isNaN(val)) {
                    hemDropdown.selection = null;
                    hemDropdown.items.add('item', String(val));
                    hemDropdown.selection = hemDropdown.items.length - 1;
                } else {
                    alert('Please enter a valid number for Hem Width.');
                    hemDropdown.selection = (defaultIndex >= 0 ? defaultIndex : 0);
                }
            } else {
                hemDropdown.selection = (defaultIndex >= 0 ? defaultIndex : 0);
            }
        }
    };

    var fBuA = addMandatoryField('5. BuA (degrees)', defaults.BuA);

    // Optional measurements
    var fCrHRed = addOptionalField('1. CrH reduction (0-1 cm)', '', { helpTip: 'see page 100, point 4' });

    var fHemShorten = addOptionalField('2. Shorten hemline by (0-4 cm)', 0, { helpTip: 'see page 100, point 6' });

    var fCroExtAdj = addOptionalField('3. Front Crotch Adjustment (-0.5 - 0.5 cm)', '', { helpTip: 'see page 101, point 10' });
    var frontCroNote = optionalPanel.add('statictext', undefined, '(negative subtracts, positive adds)', { multiline: true });
    try { frontCroNote.graphics.font = ScriptUI.newFont('dialog', 'italic', 9); } catch (eFrontNoteFont) {}
    try { frontCroNote.preferredSize = [300, -1]; } catch (eFrontNoteSize) {}
    frontCroNote.alignment = 'left';

    var fSquareUp = addOptionalField('4. Square up from 15 and 16 (4-8 cm)', 6, { helpTip: 'see page 101, point 16a and 15a' });

    var fFrontWaistRed = addOptionalField('5. Front Waist Reduction (0.5 - 1 cm)', '', { helpTip: 'see page 102, point 20' });

    var fWaistEase = addOptionalField('6. Total Waist Ease (cm)', 0);

    var fWaDiff = null;

    var fSideDart = null;
    var fFrontDart = null;
    var fBackDart1 = null;
    var fBackDart2 = null;

    var fWaDiffCheck = null;

    var fFrontDartLen = addOptionalField('7. Length of Front Dart (9-10 cm)', 10);
    var fBackDart1Len = addOptionalField('8. Length of 1st Back Dart (13-15 cm)', 14);
    var fBackDart2Len = addOptionalField('9. Length of 2nd Back Dart (cm)', 12);
    var fLegSeamShape = addOptionalField('10. Front Side and Inner Leg Shaping (0-1 cm)', 1, { helpTip: 'see page 103, point 22 & 23' });

    var fBackHipAdj = addOptionalField('11. Back Hip Adjustment (-0.5 - 1 cm)', '', { helpTip: 'see page 104, point 25' });
    var backHipNote = optionalPanel.add('statictext', undefined, '(negative subtracts, positive adds)', { multiline: true });
    try { backHipNote.graphics.font = ScriptUI.newFont('dialog', 'italic', 9); } catch (eBackHipFont) {}
    try { backHipNote.preferredSize = [300, -1]; } catch (eBackHipSize) {}
    backHipNote.alignment = 'left';

    var fBackInseamReduction = addOptionalField('12. Back Inseam Reduction (0.5-1.5 cm)', 1, { helpTip: 'see page 106, point 38' });

    var fKnH = addOptionalField('13. Knee Height (KnH)', '');
    var fCrL = addOptionalField('14. Crotch Length (CrL)', '');

    var tummyGroup = optionalPanel.add('group');
    tummyGroup.add('statictext', undefined, 'Tummy Profile:');
    var tummyProfileDD = tummyGroup.add('dropdownlist', undefined, ['Flat', 'Normal', 'Fuller']);
    tummyProfileDD.selection = 1;
    tummyGroup.alignment = 'left';

    var hipGroup = optionalPanel.add('group');
    hipGroup.add('statictext', undefined, 'Hip Profile:');
    var hipProfileDD = hipGroup.add('dropdownlist', undefined, ['Flat', 'Normal', 'Curvy']);
    hipProfileDD.selection = 1;
    hipGroup.alignment = 'left';

    var hipBoneGroup = optionalPanel.add('group');
    hipBoneGroup.add('statictext', undefined, 'Hip Bone Curve:');
    var hipBoneCurveDD = hipBoneGroup.add('dropdownlist', undefined, ['Less curvy', 'Normal', 'More curvy']);
    hipBoneCurveDD.selection = 1;
    hipBoneGroup.alignment = 'left';

    var thighProfileGroup = optionalPanel.add('group');
    thighProfileGroup.add('statictext', undefined, 'Thigh Profile:');
    var thighProfileDD = thighProfileGroup.add('dropdownlist', undefined, ['Thin', 'Normal', 'Full']);
    thighProfileDD.selection = 1;
    thighProfileGroup.alignment = 'left';

    var profileGroup = optionalPanel.add('group');
    profileGroup.add('statictext', undefined, 'Buttocks Profile:');
    var buttockProfile = profileGroup.add('dropdownlist', undefined, ['Flat', 'Normal', 'Full']);
    buttockProfile.selection = 1;
    profileGroup.alignment = 'left';

    var btnGroup = dlg.add('group');
    btnGroup.alignment = 'center';
    btnGroup.add('button', undefined, 'OK', {name: 'ok'});
    btnGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    if (dlg.show() !== 1) return;

    var sWaH = parseFloat(fsWaH.text);
    if (isNaN(sWaH)) sWaH = defaults.sWaH;
    var CrH = parseFloat(fCrH.text);
    if (isNaN(CrH)) CrH = defaults.CrH;
    var thighProfile = thighProfileDD.selection ? thighProfileDD.selection.text : 'Normal';
    var CrotchExtAdjust = parseFloat(fCroExtAdj.text);
    if (isNaN(CrotchExtAdjust)) CrotchExtAdjust = 0;
    if (thighProfile && thighProfile.toLowerCase && thighProfile.toLowerCase() === 'full' && CrotchExtAdjust < 1.5) {
        CrotchExtAdjust = 1.5;
        try { fCroExtAdj.text = '1.5'; } catch (eSetFrontCrotch) {}
    }
    // ExtendScript on some Illustrator versions lacks String.prototype.trim; provide a safe fallback
    function __trimStr(v) {
        try { return (v != null) ? ('' + v).replace(/^[\s\u00A0]+|[\s\u00A0]+$/g, '') : ''; } catch (e) { return ''; }
    }
    var __rawBackCEx = (typeof fBackCroExtAdj !== 'undefined' && fBackCroExtAdj && typeof fBackCroExtAdj.text === 'string') ? fBackCroExtAdj.text : '';
    var BackCrotchExtUserProvided = (__rawBackCEx != null && __trimStr(__rawBackCEx) !== '');
    var BackCrotchExtAdjust = BackCrotchExtUserProvided ? parseFloat(__rawBackCEx) : null;
    if (BackCrotchExtUserProvided && isNaN(BackCrotchExtAdjust)) BackCrotchExtAdjust = 0;
    var CrHReduction = parseFloat(fCrHRed.text);
    if (isNaN(CrHReduction)) CrHReduction = 0;
    var __backState = { use: null, hipDrop: null, p30: null, p31: null, p32: null, p33: null, p34: null, p35: null };
    var __frontInseam1723 = null;
    var __backWaistDone = false;
    function __buildBackWaistAndDarts() {
        if (__backWaistDone) return;
        try {
            if (!__backState.use || !__backState.p30 || !__backState.p31 || !__backState.p32 || !__backState.p33) return;
            if (typeof __hipDrop === 'undefined') return;

            var __use = __backState.use;
            var __p30 = __backState.p30;
            var __p31 = __backState.p31;
            var __p32 = __backState.p32;
            var __p33 = __backState.p33;

            if (!(__use.p28 && __use.p27)) return;

            function __lineIntersection(originA, dirA, originB, dirB) {
                var det = dirA[0]*dirB[1] - dirA[1]*dirB[0];
                if (Math.abs(det) < 1e-6) return null;
                var diffX = originB[0] - originA[0];
                var diffY = originB[1] - originA[1];
                var t = (diffX*dirB[1] - diffY*dirB[0]) / det;
                return [ originA[0] + dirA[0]*t, originA[1] + dirA[1]*t ];
            }

            var __frontHipVec = (typeof __p7 !== 'undefined' && __p7) ? [ __p7[0], __p7[1] ] : null;
            var __frontSidePoint = (typeof __p21 !== 'undefined' && __p21) ? [ __p21[0], __p21[1] ] : null;
            if (!__frontHipVec || !__frontSidePoint) return;

            var __frontSideWaistPts = null;
            var __backSideSharePlan = (__dartPlan && typeof __dartPlan.backSideShare === 'number' && !isNaN(__dartPlan.backSideShare)) ? __dartPlan.backSideShare : ((typeof BackSideDart === 'number' && !isNaN(BackSideDart)) ? BackSideDart : 0);
            if (__backSideSharePlan < 0) __backSideSharePlan = 0;
            var __backSideShiftPts = cm(__backSideSharePlan);
            if (__backSideShiftPts < 1e-6) {
                var __frontSideWaistPts = null;
                try {
                    if ($.global.measurements && typeof $.global.measurements.FrontSideDart === 'number' && !isNaN($.global.measurements.FrontSideDart)) {
                        __frontSideWaistPts = cm(Math.max(0, $.global.measurements.FrontSideDart));
                    }
                } catch (eFrontSideShare) {}
                if (__frontSideWaistPts == null) {
                    __frontSideWaistPts = Math.sqrt(__frontSidePoint[0]*__frontSidePoint[0] + __frontSidePoint[1]*__frontSidePoint[1]);
                }
                if (__frontSideWaistPts < 1e-6) return;
                __backSideShiftPts = __frontSideWaistPts;
            }

            var __vec33to32 = [ __p32[0] - __p33[0], __p32[1] - __p33[1] ];
            var __len33to32 = Math.sqrt(__vec33to32[0]*__vec33to32[0] + __vec33to32[1]*__vec33to32[1]) || 1;
            var __waistUnit = [ -__vec33to32[0] / __len33to32, -__vec33to32[1] / __len33to32 ];

            var __p35 = [ __p32[0] + __waistUnit[0] * __backSideShiftPts, __p32[1] + __waistUnit[1] * __backSideShiftPts ];
            var __waistVecBack = [ __p35[0] - __p32[0], __p35[1] - __p32[1] ];
            var __waistLen = Math.sqrt(__waistVecBack[0]*__waistVecBack[0] + __waistVecBack[1]*__waistVecBack[1]) || 1;
            __waistUnit = [ __waistVecBack[0] / __waistLen, __waistVecBack[1] / __waistLen ];
            var __waistNormal = [ -__waistUnit[1], __waistUnit[0] ];
            if (__waistNormal[1] < 0) { __waistNormal[0] *= -1; __waistNormal[1] *= -1; }

            var __storedHipDrop = ($.global.measurements && typeof $.global.measurements.FrontHipDropCm === 'number') ? $.global.measurements.FrontHipDropCm : null;
            var __frontHipDropPts = (__storedHipDrop != null) ? cm(Math.max(0, __storedHipDrop)) : Math.sqrt(__frontHipVec[0]*__frontHipVec[0] + __frontHipVec[1]*__frontHipVec[1]);
            if (__frontHipDropPts < 1e-6) return;

            var __vec32to28 = [ __use.p28[0] - __p32[0], __use.p28[1] - __p32[1] ];
            var __len32to28 = Math.sqrt(__vec32to28[0]*__vec32to28[0] + __vec32to28[1]*__vec32to28[1]) || 1;
            var __hipUnitFrom32 = [ __vec32to28[0] / __len32to28, __vec32to28[1] / __len32to28 ];
            var __pBackHip = [ __p32[0] + __hipUnitFrom32[0] * __frontHipDropPts, __p32[1] + __hipUnitFrom32[1] * __frontHipDropPts ];

            var __hipVec = [ __pBackHip[0] - __use.p27[0], __pBackHip[1] - __use.p27[1] ];
            var __hipLen = Math.sqrt(__hipVec[0]*__hipVec[0] + __hipVec[1]*__hipVec[1]);
            var __hipUnit;
            if (__hipLen < 1e-6) {
                __hipLen = __frontHipDropPts || cm(1);
                __hipUnit = [ __hipUnitFrom32[0], __hipUnitFrom32[1] ];
            } else {
                __hipUnit = [ __hipVec[0] / __hipLen, __hipVec[1] / __hipLen ];
            }

            // Mirror the front side curve (21-7) onto the back side seam.
            var __frontSideVec = [ __frontSidePoint[0] - __frontHipVec[0], __frontSidePoint[1] - __frontHipVec[1] ];
            var __frontSideLen = Math.sqrt(__frontSideVec[0]*__frontSideVec[0] + __frontSideVec[1]*__frontSideVec[1]) || 1;
            var __backSideVec = [ __p35[0] - __pBackHip[0], __p35[1] - __pBackHip[1] ];
            var __backSideLen = Math.sqrt(__backSideVec[0]*__backSideVec[0] + __backSideVec[1]*__backSideVec[1]) || 1;

            var __frontHandleVec = [ 0, -cm(11) ];
            var __frontUnit = [ __frontSideVec[0] / (__frontSideLen || 1), __frontSideVec[1] / (__frontSideLen || 1) ];
            var __frontNormal = [ -__frontUnit[1], __frontUnit[0] ];
            var __frontAlong = (__frontHandleVec[0] * __frontUnit[0]) + (__frontHandleVec[1] * __frontUnit[1]);
            var __frontNormalComp = (__frontHandleVec[0] * __frontNormal[0]) + (__frontHandleVec[1] * __frontNormal[1]);
            var __scaleSide = __backSideLen / (__frontSideLen || 1);
            var __backUnit = [ __backSideVec[0] / (__backSideLen || 1), __backSideVec[1] / (__backSideLen || 1) ];
            var __backNormal = [ -__backUnit[1], __backUnit[0] ];
            var __backHandleVec = [
                __backUnit[0] * (__frontAlong * __scaleSide) + __backNormal[0] * (__frontNormalComp * __scaleSide),
                __backUnit[1] * (__frontAlong * __scaleSide) + __backNormal[1] * (__frontNormalComp * __scaleSide)
            ];
            var __backHandleHip = [ __pBackHip[0] + __backHandleVec[0], __pBackHip[1] + __backHandleVec[1] ];

            __backState.p35 = __p35;
            try { drawMarkerOn('Back Construction', __p35, 35); } catch (eMk35) {}
            try { drawLineOn('Back Construction', __p32, __p35, 1, 'Back Waist 32-35'); } catch (eLine3235) {}
            var __rawBWR = (typeof fFrontWaistRed !== 'undefined' && fFrontWaistRed && typeof fFrontWaistRed.text === 'string') ? fFrontWaistRed.text : '';
            var __bwrProvided = (__rawBWR != null && __trimStr(__rawBWR) !== '');
            var __bwr = __bwrProvided ? parseFloat(__rawBWR) : null;
            if (__bwrProvided && isNaN(__bwr)) __bwr = 0;
            if (!__bwrProvided) {
                var __ratio = (!isNaN(WaC) && !isNaN(HiC) && HiC > 0) ? (WaC / HiC) : null;
                __bwr = (__ratio != null && __ratio < 0.75) ? 1 : 0.5;
            }
            if (__bwr < 0.5) __bwr = 0.5; if (__bwr > 1) __bwr = 1;

            var __dirTo32 = [ __p32[0] - __p33[0], __p32[1] - __p33[1] ];
            var __dirLen32 = Math.sqrt(__dirTo32[0]*__dirTo32[0] + __dirTo32[1]*__dirTo32[1]) || 1;
            var __dirUnit32 = [ __dirTo32[0] / __dirLen32, __dirTo32[1] / __dirLen32 ];
            var __p34 = [ __p33[0] + __dirUnit32[0] * cm(__bwr), __p33[1] + __dirUnit32[1] * cm(__bwr) ];
            __backState.p34 = __p34;
            drawMarkerOn('Back Construction', __p34, 34);
            try {
                var __seg3427 = drawLineOn('Back Construction', __p34, __use.p27, 1.2, '34 to 27');
                try {
                    var __ppA = __seg3427.pathPoints[0], __ppB = __seg3427.pathPoints[1];
                    __ppA.leftDirection = __ppA.anchor; __ppA.rightDirection = __ppA.anchor; __ppA.pointType = PointType.CORNER;
                    __ppB.leftDirection = __ppB.anchor; __ppB.rightDirection = __ppB.anchor; __ppB.pointType = PointType.CORNER;
                } catch (eCorner3427) {}
            } catch (eLine3427) {}

            try {
                if (__use && __use.p27 && __p33) {
                    var __vecCB = [ __use.p27[0] - __p33[0], __use.p27[1] - __p33[1] ];
                    var __vecCBLen = Math.sqrt(__vecCB[0]*__vecCB[0] + __vecCB[1]*__vecCB[1]);
                    if (__vecCBLen > 1e-6) {
                        var __cbPoint = [ __p33[0] + (__vecCB[0] * (2 / 3)), __p33[1] + (__vecCB[1] * (2 / 3)) ];
                        var __cbNormal = [ -__vecCB[1], __vecCB[0] ];
                        var __cbNormLen = Math.sqrt(__cbNormal[0]*__cbNormal[0] + __cbNormal[1]*__cbNormal[1]) || 1;
                        __cbNormal[0] /= __cbNormLen; __cbNormal[1] /= __cbNormLen;
                        if (__cbNormal[0] > 0) { __cbNormal[0] *= -1; __cbNormal[1] *= -1; }
                        var __cbOffset = cm(0.6);
                        var __cbDraft = [ __cbPoint[0] + __cbNormal[0] * __cbOffset, __cbPoint[1] + __cbNormal[1] * __cbOffset ];
                        __cbDraft[0] -= cm(0.5);
                        var __cbLabelPt = toArt(__cbDraft);
                        var __tfCB = LABELS_DIM_GROUP.textFrames.add();
                        __tfCB.contents = 'CB';
                        try { __tfCB.name = 'Back CB label'; } catch (eNmCB) {}
                        __tfCB.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
                        __tfCB.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                        __tfCB.left = __cbLabelPt[0];
                        __tfCB.top  = __cbLabelPt[1];
                    }
                }
            } catch (eLblCB) {}

            try {
                var __backCurve = LAYERS['Back Construction'].lines.pathItems.add();
                __backCurve.setEntirePath([ toArt(__pBackHip), toArt(__p35) ]);
                __backCurve.stroked = true;
                __backCurve.filled = false;
                __backCurve.strokeWidth = 1;
                try { __backCurve.strokeColor = layerColor('Back Construction'); } catch (eClrBackCurve) {}
                try { __backCurve.name = 'Back Side Curve 35-28'; } catch (eNmBackCurve) {}
                var __bp0 = __backCurve.pathPoints[0], __bp1 = __backCurve.pathPoints[1];
                __bp0.leftDirection = toArt(__pBackHip);
                __bp0.rightDirection = toArt(__backHandleHip);
                __bp0.pointType = PointType.SMOOTH;
                __bp1.leftDirection = toArt(__p35);
                __bp1.rightDirection = toArt(__p35);
                __bp1.pointType = PointType.CORNER;
            } catch (eBackCurve) {}

            var __backWaistSpanPts = Math.sqrt(Math.pow(__p35[0] - __p34[0], 2) + Math.pow(__p35[1] - __p34[1], 2));
            var __backWaistSpanCm = __backWaistSpanPts / cm(1);
            __backWaistBaseCm = __backWaistSpanCm;
            if (__p34 && __p35) {
                __postBackWaistPoints = [ __clonePoint(__p34), __clonePoint(__p35) ];
                __maybeSetPostPlan();
            }
            __updateMeasuredWaistTotals();
            var __primaryBack = (typeof BackDart1 === 'number' && !isNaN(BackDart1)) ? Math.max(0, BackDart1) : 0;
            var __secondaryBack = (typeof BackDart2 === 'number' && !isNaN(BackDart2)) ? Math.max(0, BackDart2) : 0;
            var __drawFirst = (__primaryBack > 0.5);
            if (!__drawFirst) __primaryBack = 0;
            var __firstWidthCalc = __primaryBack;
            var __secondWidthCalc = __secondaryBack;
            var __multiDart = (__secondWidthCalc > 0.01);

            var __pointL = null, __pointM = null, __pointN = null, __pointO = null;
            var __pointP = null, __pointQ = null, __pointR = null, __pointS = null;

            if (__drawFirst && __hipLen > 1e-6 && __firstWidthCalc > 0.001) {
                var __hipLenCm = __hipLen / cm(1);
                var __dFirstCm = __multiDart ? ((__hipLenCm / 3) + 1.5) : (__hipLenCm / 2);
                if (__dFirstCm > __hipLenCm - 0.1) __dFirstCm = __hipLenCm - 0.1;
                if (__dFirstCm < 0) __dFirstCm = 0;
                var __dFirstPts = cm(__dFirstCm);
                var __firstBase = [ __use.p27[0] + __hipUnit[0] * __dFirstPts, __use.p27[1] + __hipUnit[1] * __dFirstPts ];
                var __squareDir = [ -__hipUnit[1], __hipUnit[0] ];
                var __toWaistVec = [ __p35[0] - __firstBase[0], __p35[1] - __firstBase[1] ];
                if (__toWaistVec[0]*__squareDir[0] + __toWaistVec[1]*__squareDir[1] < 0) {
                    __squareDir[0] *= -1; __squareDir[1] *= -1;
                }
                var __l = __lineIntersection(__firstBase, __squareDir, __p34, __waistUnit);
                if (__l) {
                    drawDashedLineOn('Back Construction', __firstBase, __l, 1, 'Back Dart 1 Center');
                    placeLetterOn('Back Construction', __l, 'l');
                    var __halfD1Pts = cm(__firstWidthCalc / 2);
                    var __maxHalfD1 = Math.max(0, (__backWaistSpanPts / 2) - cm(0.05));
                    if (__halfD1Pts > __maxHalfD1) __halfD1Pts = __maxHalfD1;
                    if (__halfD1Pts < 1e-6) {
                        __drawFirst = false;
                        __firstWidthCalc = 0;
                    } else {
                        __firstWidthCalc = (__halfD1Pts * 2) / cm(1);
                        __pointL = __l;
                        __pointM = [ __l[0] - __waistUnit[0] * __halfD1Pts, __l[1] - __waistUnit[1] * __halfD1Pts ];
                        __pointN = [ __l[0] + __waistUnit[0] * __halfD1Pts, __l[1] + __waistUnit[1] * __halfD1Pts ];
                        if (__pointM[0] > __pointN[0]) { var __tmpMN = __pointM; __pointM = __pointN; __pointN = __tmpMN; }
                        placeLetterOn('Back Construction', __pointM, 'm');
                        placeLetterOn('Back Construction', __pointN, 'n');
                        var __backDart1LenVal = parseFloat(fBackDart1Len.text);
                        if (isNaN(__backDart1LenVal)) __backDart1LenVal = 14;
                        if (__backDart1LenVal < 0) __backDart1LenVal = 0;
                        var __centerDir = [ __firstBase[0] - __l[0], __firstBase[1] - __l[1] ];
                        var __centerLen = Math.sqrt(__centerDir[0]*__centerDir[0] + __centerDir[1]*__centerDir[1]);
                        if (__centerLen < 1e-6) {
                            __centerDir = [ __waistNormal[0], __waistNormal[1] ];
                            __centerLen = Math.sqrt(__centerDir[0]*__centerDir[0] + __centerDir[1]*__centerDir[1]) || 1;
                        }
                        __centerDir[0] /= __centerLen; __centerDir[1] /= __centerLen;
                        __pointO = [ __l[0] + __centerDir[0] * cm(__backDart1LenVal), __l[1] + __centerDir[1] * cm(__backDart1LenVal) ];
                        placeLetterOn('Back Construction', __pointO, 'o');
                        drawLineOn('Back Construction', __pointM, __pointO, 1, 'Back Dart 1 Left');
                        drawLineOn('Back Construction', __pointN, __pointO, 1, 'Back Dart 1 Right');
                    }
                } else {
                    __drawFirst = false;
                    __firstWidthCalc = 0;
                }
            } else {
                __drawFirst = false;
                __firstWidthCalc = 0;
            }

            var __secondDrawn = false;
            if (__secondWidthCalc > 0.01) {
                var __halfD2Pts = cm(__secondWidthCalc / 2);
                var __maxHalfD2 = Math.max(0, (__backWaistSpanPts / 2) - cm(0.05));
                if (__halfD2Pts > __maxHalfD2) __halfD2Pts = __maxHalfD2;
                if (__halfD2Pts > 0.001) {
                    if (__drawFirst && __pointM && __pointN) {
                        var __p = [ (__pointM[0] + __p35[0]) / 2, (__pointM[1] + __p35[1]) / 2 ];
                        placeLetterOn('Back Construction', __p, 'p');
                        var __q = [ __p[0] - __waistUnit[0] * __halfD2Pts, __p[1] - __waistUnit[1] * __halfD2Pts ];
                        var __r = [ __p[0] + __waistUnit[0] * __halfD2Pts, __p[1] + __waistUnit[1] * __halfD2Pts ];
                        if (__q[0] > __r[0]) { var __tmpQR = __q; __q = __r; __r = __tmpQR; }
                    } else {
                        var __p = [ (__p34[0] + __p35[0]) / 2, (__p34[1] + __p35[1]) / 2 ];
                        placeLetterOn('Back Construction', __p, 'p');
                        var __q = [ __p[0] - __waistUnit[0] * __halfD2Pts, __p[1] - __waistUnit[1] * __halfD2Pts ];
                        var __r = [ __p[0] + __waistUnit[0] * __halfD2Pts, __p[1] + __waistUnit[1] * __halfD2Pts ];
                    }
                    placeLetterOn('Back Construction', __q, 'q');
                    placeLetterOn('Back Construction', __r, 'r');
                    var __backDart2LenVal = parseFloat(fBackDart2Len.text);
                    if (isNaN(__backDart2LenVal)) __backDart2LenVal = 12;
                    if (__backDart2LenVal < 0) __backDart2LenVal = 0;
                    var __pDown = [ __p[0] + __waistNormal[0] * cm(__backDart2LenVal), __p[1] + __waistNormal[1] * cm(__backDart2LenVal) ];
                    placeLetterOn('Back Construction', __pDown, 's');
                    drawDashedLineOn('Back Construction', __p, __pDown, 1, 'Back Dart 2 Center');
                    drawLineOn('Back Construction', __q, __pDown, 1, 'Back Dart 2 Left');
                    drawLineOn('Back Construction', __r, __pDown, 1, 'Back Dart 2 Right');
                    __secondDrawn = true;
                } else {
                    __secondWidthCalc = 0;
                }
            }

            if (!__secondDrawn) {
                __secondWidthCalc = 0;
            }

            BackDart1 = __firstWidthCalc;
            BackDart2 = __secondWidthCalc;
            try {
                if ($.global.measurements) {
                    $.global.measurements.BackDart1 = __firstWidthCalc;
                    $.global.measurements.BackDart2 = __secondWidthCalc;
                }
            } catch (eStoreBackDartFinal) {}

            var __backSeamAfterDartsCm = Math.max(0, __backWaistSpanCm - (__firstWidthCalc + __secondWidthCalc));
            __backWaistBaseCm = __backSeamAfterDartsCm;
            __dartPlan.backAfterDarts = __backSeamAfterDartsCm;
            __dartPlan.backDart1 = __firstWidthCalc;
            __dartPlan.backDart2 = __secondWidthCalc;
            __postBackWaistPoints = __backSeamAfterDartsCm;
            var __totalWaistAfter = ((__frontWaistBaseCm != null && !isNaN(__frontWaistBaseCm)) ? __frontWaistBaseCm : 0) + __backSeamAfterDartsCm;
            __dartPlan.backRemainder = Math.max(0, (__totalWaistAfter - __targetHalfWaist));
            __writeDartPlanToMeasurements();
            __updateMeasuredWaistTotals();
            try {
                if ($.global.measurements) $.global.measurements.BackWaistSeam = __backSeamAfterDartsCm;
            } catch (eStoreBackWaistSeam) {}
            __logDartPlan('back-final', {
                frontAfter: __frontWaistBaseCm,
                backAfter: __backSeamAfterDartsCm,
                remainder: __dartPlan.backRemainder,
                backDart1: __firstWidthCalc,
                backDart2: __secondWidthCalc
            });

            try {
                if (typeof __p34 !== 'undefined' && __p34 && typeof __p35 !== 'undefined' && __p35 && typeof __backWaistSpanCm === 'number' && !isNaN(__backWaistSpanCm)) {
                    var __mid3435 = [ (__p34[0] + __p35[0]) / 2, (__p34[1] + __p35[1]) / 2 ];
                    var __angle3435 = Math.atan2((__p35[1] - __p34[1]), (__p35[0] - __p34[0])) * 180 / Math.PI;
                    var __pageAngle3435 = -__angle3435;
                    if (__pageAngle3435 > 90) __pageAngle3435 -= 180;
                    if (__pageAngle3435 < -90) __pageAngle3435 += 180;
                    try {
                        var __dartDeduction = Math.max(0, (BackDart1 || 0) + (BackDart2 || 0));
                        var __waistNoDart = Math.max(0, __backWaistSpanCm - __dartDeduction);
                        try { if ($.global.measurements) $.global.measurements.BackWaistNoDart = __waistNoDart; } catch (eStoreBackWaist) {}
                        var __waistSpanStr = (Math.round(__waistNoDart * 100) / 100).toFixed(2);
                        var __measureDraft = [ __mid3435[0], __mid3435[1] + cm(0.5) ];
                        var __measurePt = toArt(__measureDraft);
                        var __tfWaistSpan = LABELS_DIM_GROUP.textFrames.add();
                        __tfWaistSpan.contents = 'Back Waist ' + __waistSpanStr + 'cm';
                        try { __tfWaistSpan.name = 'Back Waist measurement'; } catch (eNmWaistSpan) {}
                        __tfWaistSpan.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
                        __tfWaistSpan.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                        __tfWaistSpan.left = __measurePt[0];
                        __tfWaistSpan.top  = __measurePt[1];
                        try { __tfWaistSpan.rotate(__pageAngle3435); } catch (eRotWaistSpan) {}
                    } catch (eWaistSpanLabel) {}
                }
            } catch (eBackWaistLabels) {}

            __backWaistDone = true;
        } catch (eBackWaistFinal) {}
    }


    if (CrHReduction < 0) CrHReduction = 0;
    if (CrHReduction > 1) CrHReduction = 1;
    var HiC = parseFloat(fHiC.text);
    if (isNaN(HiC)) HiC = defaults.HiC;
    var WaC = parseFloat(fWaC.text);
    if (isNaN(WaC)) WaC = defaults.WaC;

    var CrL = parseFloat(fCrL.text);
    if (isNaN(CrL)) {
        var __crlFallback = (!isNaN(sWaH) && !isNaN(CrH)) ? (sWaH - CrH) : defaults.CrL;
        if (typeof __crlFallback === 'number' && !isNaN(__crlFallback)) CrL = __crlFallback;
    }
    if (isNaN(CrL)) CrL = (defaults.CrL != null && !isNaN(defaults.CrL)) ? defaults.CrL : 0;
    if (CrL < 0) CrL = 0;

    var __derivedKnH = Math.max(0, (CrL / 10) * 4);
    var KnH = parseFloat(fKnH.text);
    if (isNaN(KnH)) KnH = __derivedKnH;
    if (isNaN(KnH) && defaults.KnH != null && !isNaN(defaults.KnH)) KnH = defaults.KnH;
    if (isNaN(KnH)) KnH = __derivedKnH;
    if (isNaN(KnH) || KnH < 0) KnH = 0;

    var ThC = defaults.ThC;

    try {

        if ($.global && $.global.measurements && typeof $.global.measurements.ThC === 'number' && !isNaN($.global.measurements.ThC)) {

            ThC = $.global.measurements.ThC;

        }

    } catch (ePrevThC) {}
    var HEM = parseFloat(hemDropdown.selection.text);
    var HemShorten = parseFloat(fHemShorten.text);
    if (isNaN(HemShorten)) HemShorten = 0;
    var WaistEase = parseFloat(fWaistEase.text);
    if (isNaN(WaistEase)) WaistEase = 0;
    var SideDartIn = (fSideDart && typeof fSideDart.text === 'string') ? parseFloat(fSideDart.text) : NaN;
    var FrontDartIn = (fFrontDart && typeof fFrontDart.text === 'string') ? parseFloat(fFrontDart.text) : NaN;
    var BackDart1In = (fBackDart1 && typeof fBackDart1.text === 'string') ? parseFloat(fBackDart1.text) : NaN;
    var BackDart2In = (fBackDart2 && typeof fBackDart2.text === 'string') ? parseFloat(fBackDart2.text) : NaN;
    var FrontDartLen = parseFloat(fFrontDartLen.text);
    if (isNaN(SideDartIn)) SideDartIn = 0;
    if (isNaN(FrontDartIn)) FrontDartIn = 0;
    if (isNaN(BackDart1In)) BackDart1In = 0;
    if (isNaN(BackDart2In)) BackDart2In = 0;
    if (isNaN(FrontDartLen)) FrontDartLen = 10;
    var LegSeamShape = parseFloat(fLegSeamShape.text);
    if (isNaN(LegSeamShape)) LegSeamShape = 1;
    if (LegSeamShape < 0) LegSeamShape = 0;
    var BackInseamReduction = parseFloat(fBackInseamReduction.text);
    if (isNaN(BackInseamReduction)) BackInseamReduction = 1;
    if (BackInseamReduction < 0.5) BackInseamReduction = 0.5;
    if (BackInseamReduction > 1.5) BackInseamReduction = 1.5;
    var SquareUpLen = parseFloat(fSquareUp.text);
    if (isNaN(SquareUpLen)) SquareUpLen = 6;
    var profile = buttockProfile.selection ? buttockProfile.selection.text : '';
    var BuA = parseFloat(fBuA.text) || defaults.BuA;

    if (isNaN(HiC) || isNaN(sWaH) || isNaN(WaC) || isNaN(CrH) || isNaN(HEM) || !profile) {
        alert('Please fill in all mandatory fields:\n- HiC\n- sWaH\n- WaC\n- CrH\n- HEM\n- Buttocks Profile');
        return;
    }

    var thighCheck = true;
    var crotchCheck = true;
    var tummyProfile = tummyProfileDD.selection ? tummyProfileDD.selection.text : 'Normal';
    var hipProfile = hipProfileDD.selection ? hipProfileDD.selection.text : 'Normal';
    var hipBoneCurve = hipBoneCurveDD.selection ? hipBoneCurveDD.selection.text : 'Normal';
    var __frontWaistBaseCm = null;
    var __backWaistBaseCm = null;
    var __waistMeasuredTotal = null;
    var __waistMeasuredDiff = null;

    var WaDif = 0;
    var SideDart = 0;
    var FrontSideDart = 0;
    var BackSideDart = 0;
    var FrontDart = 0;
    var BackDart1 = 0;
    var BackDart2 = 0;

    // New initial dart plan computed from geometry
    var __targetHalfWaist = (WaC + WaistEase) / 2;
    var __dartPlan = {
        frontRaw: null,
        backRaw: null,
        frontAfterDart: null,
        backAfterSide: null,
        backAfterDarts: null,
        sideShare: null,
        frontSideShare: null,
        backSideShare: null,
        frontDart: null,
        backDart1: null,
        backDart2: null,
        backRemainder: null
    };
    var __initialFrontWaistPoints = null;
    var __initialBackWaistPoints = null;
    var __postFrontWaistPoints = null;
    var __postBackWaistPoints = null;
    var __initialPlanApplied = false;
    var __postPlanApplied = false;

    function __resetDartPlan() {
        WaDif = 0;
        SideDart = 0;
        FrontSideDart = 0;
        BackSideDart = 0;
        FrontDart = 0;
        BackDart1 = 0;
        BackDart2 = 0;
        __dartPlan.frontRaw = null;
        __dartPlan.backRaw = null;
        __dartPlan.frontAfterDart = null;
        __dartPlan.backAfterSide = null;
        __dartPlan.backAfterDarts = null;
        __dartPlan.sideShare = null;
        __dartPlan.frontSideShare = null;
        __dartPlan.backSideShare = null;
        __dartPlan.frontDart = null;
        __dartPlan.backDart1 = null;
        __dartPlan.backDart2 = null;
        __dartPlan.backRemainder = null;
        __initialFrontWaistPoints = null;
        __initialBackWaistPoints = null;
        __postFrontWaistPoints = null;
        __postBackWaistPoints = null;
        __initialPlanApplied = false;
        __postPlanApplied = false;
        __frontWaistBaseCm = null;
        __backWaistBaseCm = null;
        __waistMeasuredTotal = null;
        __waistMeasuredDiff = null;
        __updateMeasuredWaistTotals();
    }

    function __applyInitialWaistPlan(frontRawCm, backRawCm) {
        frontRawCm = isNaN(frontRawCm) ? 0 : frontRawCm;
        backRawCm = isNaN(backRawCm) ? 0 : backRawCm;
        __dartPlan.frontRaw = frontRawCm;
        __dartPlan.backRaw = backRawCm;
        var __excess = (frontRawCm + backRawCm) - __targetHalfWaist;
        WaDif = Math.max(0, isNaN(__excess) ? 0 : __excess);

        var hipLower = hipProfile ? hipProfile.toLowerCase() : '';
        var __profileAdjust = (hipLower === 'curvy') ? 1 : (hipLower === 'flat') ? -1 : 0;

        var __sideShare = (WaDif / 2) + __profileAdjust;
        if (__sideShare < 0) __sideShare = 0;
        if (__sideShare > WaDif) __sideShare = WaDif;

        var __frontSideShare = __sideShare / 2;
        var __backSideShare = __sideShare - __frontSideShare;

        var __remaining = WaDif - __sideShare;
        if (__remaining < 0) __remaining = 0;

        var __frontDartPlan = Math.min(2.5, __remaining / 3);
        __remaining -= __frontDartPlan;
        if (__remaining < 0) {
            __frontDartPlan += __remaining;
            __remaining = 0;
            if (__frontDartPlan < 0) __frontDartPlan = 0;
        }

        var __backPrimary = Math.min(4.5, __remaining);
        var __backSecondary = Math.max(0, __remaining - __backPrimary);

        __dartPlan.sideShare = __sideShare;
        __dartPlan.frontSideShare = __frontSideShare;
        __dartPlan.backSideShare = __backSideShare;
        __dartPlan.frontDart = __frontDartPlan;
        __dartPlan.backDart1 = __backPrimary;
        __dartPlan.backDart2 = __backSecondary;
        __dartPlan.backRemainder = __remaining;

        SideDart = __sideShare;
        FrontSideDart = __frontSideShare;
        BackSideDart = __backSideShare;
        FrontDart = __frontDartPlan;
        BackDart1 = __backPrimary;
        BackDart2 = __backSecondary;
        __writeDartPlanToMeasurements();
        __updateMeasuredWaistTotals();

        __logDartPlan('initial', {
            frontRaw: __dartPlan.frontRaw,
            backRaw: __dartPlan.backRaw,
            waDiff: WaDif,
            sideShare: __dartPlan.sideShare,
            frontSide: __dartPlan.frontSideShare,
            backSide: __dartPlan.backSideShare,
            frontDart: __dartPlan.frontDart,
            backDart1: __dartPlan.backDart1,
            backDart2: __dartPlan.backDart2
        });
    }

    function __updateBackDartPlan(frontSeamCm, backSpanCm) {
        frontSeamCm = isNaN(frontSeamCm) ? 0 : frontSeamCm;
        backSpanCm = isNaN(backSpanCm) ? 0 : backSpanCm;
        __dartPlan.frontAfterDart = frontSeamCm;
        __dartPlan.backAfterSide = backSpanCm;
        __dartPlan.backAfterDarts = null;
        __frontWaistBaseCm = frontSeamCm;
        __backWaistBaseCm = backSpanCm;
        var __remainder = (frontSeamCm + backSpanCm) - __targetHalfWaist;
        __remainder = Math.max(0, isNaN(__remainder) ? 0 : __remainder);
        var __primary = Math.min(4.5, __remainder);
        if (__primary <= 0.5) __primary = 0;
        var __secondary = (__primary === 0) ? 0 : Math.max(0, __remainder - __primary);
        __dartPlan.backDart1 = __primary;
        __dartPlan.backDart2 = __secondary;
        __dartPlan.backRemainder = __remainder;

        BackDart1 = __primary;
        BackDart2 = __secondary;
        __writeDartPlanToMeasurements();
        __updateMeasuredWaistTotals();
        __logDartPlan('post-dart', {
            frontAfter: __dartPlan.frontAfterDart,
            backAfter: __dartPlan.backAfterSide,
            remainder: __dartPlan.backRemainder,
            backDart1: __dartPlan.backDart1,
            backDart2: __dartPlan.backDart2
        });
    }

    function __updateMeasuredWaistTotals() {
        try {
            if ($.global && $.global.measurements) {
                $.global.measurements.FrontWaistBase = (__frontWaistBaseCm != null) ? __frontWaistBaseCm : null;
                $.global.measurements.BackWaistBase = (__backWaistBaseCm != null) ? __backWaistBaseCm : null;
            }
        } catch (eStoreWaistBases) {}
        if (__frontWaistBaseCm != null && __backWaistBaseCm != null) {
            __waistMeasuredTotal = __frontWaistBaseCm + __backWaistBaseCm;
            __waistMeasuredDiff = __waistMeasuredTotal - __targetHalfWaist;
            try { if ($.global && $.global.measurements) $.global.measurements.WaistMeasuredTotal = __waistMeasuredTotal; } catch (eStoreWaistTotal) {}
            try { if ($.global && $.global.measurements) $.global.measurements.WaDifMeasured = __waistMeasuredDiff; } catch (eStoreWaDifMeasured) {}
            try { if (fWaDiff) fWaDiff.text = (Math.round(__waistMeasuredDiff * 100) / 100).toFixed(2); } catch (eWriteWaDiff) {}
        } else {
            __waistMeasuredTotal = null;
            __waistMeasuredDiff = null;
            try { if (fWaDiff) fWaDiff.text = ''; } catch (eWriteWaDiffClear) {}
        }
        try { if (fWaDiffCheck) fWaDiffCheck.text = ''; } catch (eDisableWaDiffCheck) {}
    }

    function __seedLegacyDartDefaults() {
        var WaW = WaC + WaistEase;
        var __seedWaDif = (HiC / 2) - (WaW / 2);
        if (isNaN(__seedWaDif)) __seedWaDif = 0;
        if (__seedWaDif < 0) __seedWaDif = 0;

        function __clamp(value, min, max) {
            if (isNaN(value)) value = 0;
            if (value < min) value = min;
            if (value > max) value = max;
            return value;
        }

        var sideDef = __seedWaDif * 0.5;
        var hipLower = hipProfile ? hipProfile.toLowerCase() : '';
        if (hipLower === 'curvy') sideDef += 0.75;
        else if (hipLower === 'flat') sideDef -= 0.75;
        sideDef = __clamp(sideDef, 0, __seedWaDif);

        WaDif = __seedWaDif;
        SideDart = (SideDartIn > 0) ? SideDartIn : sideDef;
        SideDart = __clamp(SideDart, 0, WaDif);

        var __split = (function(total) {
            var half = Math.max(0, total / 2);
            return { front: half, back: Math.max(0, total - half) };
        })(SideDart);
        FrontSideDart = __split.front;
        BackSideDart = __split.back;

        var remainder = WaDif - SideDart;
        if (remainder < 0) remainder = 0;

        FrontDart = (FrontDartIn > 0) ? FrontDartIn : remainder / 3;
        FrontDart = __clamp(FrontDart, 0, 2.5);
        remainder -= FrontDart;
        if (remainder < 0) remainder = 0;

        BackDart1 = (BackDart1In > 0) ? BackDart1In : remainder;
        BackDart1 = __clamp(BackDart1, 0, 4.5);
        if (BackDart1 > remainder) BackDart1 = remainder;
        remainder -= BackDart1;
        if (remainder < 0) remainder = 0;

        BackDart2 = (BackDart2In > 0) ? BackDart2In : remainder;
        if (isNaN(BackDart2)) BackDart2 = 0;
        if (BackDart2 < 0) BackDart2 = 0;

        (function balanceDarts() {
            var total = SideDart + FrontDart + BackDart1 + BackDart2;
            if (total > WaDif) {
                var excess = total - WaDif;
                function trim(val) {
                    var cut = Math.min(excess, Math.max(0, val));
                    excess -= cut;
                    return val - cut;
                }
                BackDart2 = trim(BackDart2);
                if (excess > 0) FrontDart = trim(FrontDart);
                if (excess > 0) SideDart = trim(SideDart);
                if (excess > 0) BackDart1 = trim(BackDart1);
            }
            var totalAfterTrim = SideDart + FrontDart + BackDart1 + BackDart2;
            if (totalAfterTrim < WaDif) {
                var shortage = WaDif - totalAfterTrim;
                var room1 = Math.max(0, 4.5 - BackDart1);
                var add1 = Math.min(shortage, room1);
                BackDart1 += add1;
                shortage -= add1;
                if (shortage > 0) BackDart2 += shortage;
            }
        })();

        __dartPlan.sideShare = SideDart;
        __dartPlan.frontSideShare = FrontSideDart;
        __dartPlan.backSideShare = BackSideDart;
        __dartPlan.frontDart = FrontDart;
        __dartPlan.backDart1 = BackDart1;
        __dartPlan.backDart2 = BackDart2;

        __writeDartPlanToMeasurements();
        __updateMeasuredWaistTotals();
    }

    __resetDartPlan();
    __seedLegacyDartDefaults();

    var __baseFrontQuarter = (WaC / 4) + (WaistEase / 4);
    var __frontWaistSeamCalc = Math.max(0, __baseFrontQuarter - FrontDart);
    var __frontWaistRawCalc = Math.max(0, __baseFrontQuarter);

    $.global.measurements = {
        sWaH: sWaH,
        CrH: CrH,
        HiC: HiC,
        WaC: WaC,
        CrL: CrL,
        KnH: KnH,
        ThC: ThC,
        HEM: HEM,
        BuA: BuA,
        profile: profile,
        thighCheck: thighCheck,
        crotchCheck: crotchCheck,
        tummyProfile: tummyProfile,
        hipProfile: hipProfile,
        thighProfile: thighProfile,
        CrHReduction: CrHReduction,
        HemShorten: HemShorten,
        CrotchExtAdjust: CrotchExtAdjust,
        SquareUpLen: SquareUpLen,
        WaistEase: WaistEase,
        WaDif: WaDif,
        FrontWaistBase: (__frontWaistBaseCm != null) ? __frontWaistBaseCm : null,
        BackWaistBase: (__backWaistBaseCm != null) ? __backWaistBaseCm : null,
        BackWaistSeam: null,
        WaDifMeasured: (__waistMeasuredDiff != null) ? __waistMeasuredDiff : null,
        WaistMeasuredTotal: (__waistMeasuredTotal != null) ? __waistMeasuredTotal : null,
        SideDart: SideDart,
        FrontSideDart: FrontSideDart,
        BackSideDart: BackSideDart,
        FrontDart: FrontDart,
        FrontWaistSeam: __frontWaistSeamCalc,
        FrontWaistRaw: __frontWaistRawCalc,
        BackDart1: BackDart1,
        BackDart2: BackDart2,
        hipBoneCurve: hipBoneCurve,
        FrontDartLen: FrontDartLen,
        LegSeamShape: LegSeamShape,
        BackCrotchExtAdjust: BackCrotchExtUserProvided ? BackCrotchExtAdjust : null
    };

    // (Info dialog removed per user preference.)

    // === Step B: Drawing Preview ===
    if (app.documents.length === 0) app.documents.add();
    var doc = app.activeDocument;

    function cm(n) { return n * 28.3464566929; }
    function makeRGB(r, g, b) {
        var c = new RGBColor();
        c.red = r; c.green = g; c.blue = b;
        return c;
    }

    function findLayerByName(name) {
        for (var i = 0; i < doc.layers.length; i++) {
            if (doc.layers[i].name === name) return doc.layers[i];
        }
        return null;
    }

    function ensureLayer(name) {
        var l = null;
        try {
            // itemByName may throw in some Illustrator versions
            l = doc.layers.itemByName(name);
        } catch (e) {
            l = findLayerByName(name);
        }
        if (l && l.typename === 'Layer') return l;
        var created = doc.layers.add();
        created.name = name;
        return created;
    }

    function findGroupByName(parent, name) {
        var groups = parent.groupItems;
        for (var i = 0; i < groups.length; i++) {
            if (groups[i].name === name) return groups[i];
        }
        return null;
    }

    function ensureGroup(parent, name) {
        var g = null;
        try {
            g = parent.groupItems.itemByName(name);
        } catch (e) {
            g = findGroupByName(parent, name);
        }
        if (g && g.typename === 'GroupItem') return g;
        g = parent.groupItems.add();
        g.name = name;
        return g;
    }


    function __writeDartPlanToMeasurements() {
        try {
            if ($.global && $.global.measurements) {
                $.global.measurements.SideDart = SideDart;
                $.global.measurements.FrontSideDart = FrontSideDart;
                $.global.measurements.BackSideDart = BackSideDart;
                $.global.measurements.FrontDart = FrontDart;
                $.global.measurements.BackDart1 = BackDart1;
                $.global.measurements.BackDart2 = BackDart2;
                $.global.measurements.WaDif = WaDif;
            }
        } catch (eSyncPlan) {}
    }

    function __distanceCm(pA, pB) {
        if (!pA || !pB) return 0;
        var dx = pA[0] - pB[0];
        var dy = pA[1] - pB[1];
        return Math.sqrt(dx*dx + dy*dy) / cm(1);
    }

    function __pathLengthCm(points) {
        if (!points || points.length < 2) return 0;
        var total = 0;
        for (var i = 1; i < points.length; i++) total += __distanceCm(points[i - 1], points[i]);
        return total;
    }

    function __resolveLengthCm(input) {
        if (typeof input === 'number') {
            return (isNaN(input) ? 0 : Math.max(0, input));
        }
        return __pathLengthCm(input);
    }

    function __clonePoint(pt) {
        return (pt && pt.length >= 2) ? [ pt[0], pt[1] ] : null;
    }

    function __formatCm(value) {
        return (typeof value === 'number' && !isNaN(value)) ? (Math.round(value * 100) / 100).toFixed(2) : 'null';
    }

    function __logDartPlan(stage, data) {
        try {
            if (typeof $ !== 'undefined' && $ && typeof $.writeln === 'function') {
                var parts = [];
                for (var key in data) {
                    if (!data.hasOwnProperty(key)) continue;
                    var val = data[key];
                    if (typeof val === 'number') {
                        parts.push(key + '=' + __formatCm(val) + 'cm');
                    } else {
                        parts.push(key + '=' + val);
                    }
                }
                $.writeln('[AutoDart][' + stage + '] ' + parts.join(' | '));
            }
        } catch (eLogPlan) {}
    }

    function __maybeSetInitialPlan() {
        if (__initialPlanApplied) return;
        if (!__initialFrontWaistPoints || !__initialBackWaistPoints) return;
        __initialPlanApplied = true;
        __setInitialWaistMeasurements(__initialFrontWaistPoints, __initialBackWaistPoints);
    }

    function __hasWaistMeasurement(data) {
        if (typeof data === 'number') {
            return !isNaN(data);
        }
        return !!(data && data.length >= 2);
    }

    function __maybeSetPostPlan() {
        if (__postPlanApplied) return;
        if (!__hasWaistMeasurement(__postFrontWaistPoints) || !__hasWaistMeasurement(__postBackWaistPoints)) return;
        __postPlanApplied = true;
        __setPostDartWaistMeasurements(__postFrontWaistPoints, __postBackWaistPoints);
    }

    function __maybeCaptureInitialBack() {
        if (__initialBackWaistPoints) return;
        if (!__backState || !__backState.p32 || !__backState.p33) return;
        __initialBackWaistPoints = [ __clonePoint(__backState.p33), __clonePoint(__backState.p32) ];
        __maybeSetInitialPlan();
    }

    function __setInitialWaistMeasurements(frontPoints, backPoints) {
        var frontRawCm = __pathLengthCm(frontPoints);
        var backRawCm = __pathLengthCm(backPoints);
        __applyInitialWaistPlan(frontRawCm, backRawCm);
    }

    function __setPostDartWaistMeasurements(frontPoints, backPoints) {
        var frontSeamCm = __resolveLengthCm(frontPoints);
        var backSpanCm = __resolveLengthCm(backPoints);
        __updateBackDartPlan(frontSeamCm, backSpanCm);
    }

    // ---- Style choices (user-approved defaults) ----
    // Colors
    var COLOR_FRAME = makeRGB(255, 0, 0);     // Red
    var COLOR_FRONT = makeRGB(0, 102, 255);   // Blue
    var COLOR_BACK  = makeRGB(0, 153, 0);     // Green

    // Text sizing
    var LABEL_FONT_SIZE_PT = 10;   // labels (+2pt as requested)
    var NUMBER_FONT_SIZE_PT = 8;  // point numbers

    // Marker size (cm only)
    var MARKER_RADIUS_CM = 0.25; // approx 7.1pt

    // Label offset (cm only) - ~8pt
    var LABEL_OFFSET_CM = 0.28;

    // ---- Layer setup (top -> bottom) ----
    var LAYER_NAMES = [
        'Back Construction',
        'Front Construction',
        'Basic Frame'
    ];

    function ensureGroupsFor(layer) {
        return {
            layer: layer,
            lines: ensureGroup(layer, 'Lines'),
            markers: ensureGroup(layer, 'Markers'),
            labels: ensureGroup(layer, 'Labels'),
            numbers: ensureGroup(layer, 'Numbers')
        };
    }

    var LAYERS = {};
    for (var iLay = 0; iLay < LAYER_NAMES.length; iLay++) {
        var lay = ensureLayer(LAYER_NAMES[iLay]);
        LAYERS[LAYER_NAMES[iLay]] = ensureGroupsFor(lay);
    }

    // Ensure visual stacking: first in LAYER_NAMES is topmost
    try {
        for (var __i = LAYER_NAMES.length - 1; __i >= 0; __i--) {
            var __nm = LAYER_NAMES[__i];
            var __layer = LAYERS[__nm].layer;
            try { __layer.zOrder(ZOrderMethod.BRINGTOFRONT); } catch (e) {}
        }
    } catch (eReorder) {}

    // Remove default 'Layer 1' that Illustrator creates by default
    try {
        var __l1 = findLayerByName('Layer 1');
        if (__l1) {
            try { __l1.locked = false; } catch (eL1a) {}
            try { __l1.visible = true; } catch (eL1b) {}
            // If it has items, move them to Basic Frame before deleting
            try {
                var __target = LAYERS['Basic Frame'] ? LAYERS['Basic Frame'].layer : null;
                if (__target && __l1.pageItems && __l1.pageItems.length > 0) {
                    for (var __k = __l1.pageItems.length - 1; __k >= 0; __k--) {
                        try { __l1.pageItems[__k].move(__target, ElementPlacement.PLACEATBEGINNING); } catch (eMove) {}
                    }
                }
            } catch (eL1c) {}
            try { __l1.remove(); } catch (eL1d) {}
        }
    } catch (eRemoveL1) {}

    try {
        var __legacyLayerNames = ['Front Pattern', 'Back Pattern'];
        for (var __legacyIdx = 0; __legacyIdx < __legacyLayerNames.length; __legacyIdx++) {
            var __legacyName = __legacyLayerNames[__legacyIdx];
            var __legacyLayer = null;
            try { __legacyLayer = findLayerByName(__legacyName); } catch (eFindLegacy) { __legacyLayer = null; }
            if (!__legacyLayer) continue;
            try { __legacyLayer.locked = false; } catch (eLegacyLock) {}
            try { __legacyLayer.visible = true; } catch (eLegacyVisible) {}
            try { __legacyLayer.remove(); } catch (eLegacyRemove) {}
        }
    } catch (eRemoveLegacyPatternLayers) {}

    // Dedicated 'Labels' layer on top, consolidate labels here
    var LABELS_DIM_NAME = 'Labels';
    var LABELS_DIM_LAYER = ensureLayer(LABELS_DIM_NAME);
    var LABELS_DIM_GROUP = ensureGroup(LABELS_DIM_LAYER, 'Labels');
    try { LABELS_DIM_LAYER.zOrder(ZOrderMethod.BRINGTOFRONT); } catch (eTop) {}

    // Remove per-layer 'Labels' groups and migrate any existing items to the dedicated layer
    try {
        for (var __li = 0; __li < LAYER_NAMES.length; __li++) {
            var __ly = LAYERS[LAYER_NAMES[__li]].layer;
            var __lblGrp = findGroupByName(__ly, 'Labels');
            if (__lblGrp) {
                try {
                    var __items = __lblGrp.pageItems;
                    for (var __ix = __items.length - 1; __ix >= 0; __ix--) {
                        try { __items[__ix].move(LABELS_DIM_GROUP, ElementPlacement.PLACEATBEGINNING); } catch (eMv) {}
                    }
                } catch (eIt) {}
                try { __lblGrp.remove(); } catch (eRm) {}
            }
        }
    } catch (eMigrate) {}

    // Basic Frame aliases (backwards-compatible with existing helpers)
    var frameLayer = LAYERS['Basic Frame'].layer;
    var linesGroup = LAYERS['Basic Frame'].lines;
    var markersGroup = LAYERS['Basic Frame'].markers;
    var labelsGroup = LAYERS['Basic Frame'].labels;
    var numbersGroup = LAYERS['Basic Frame'].numbers;

    // Margins (cm) from artboard top-left to draft origin
    var MARGIN_X_CM = 30;
    var MARGIN_Y_CM = 30;

    // Ensure artboard is at least the requested size; auto-expand to fit sWaH + margins
    function ensureArtboardMinSize(minWidthCm, minHeightCm) {
        var idx = doc.artboards.getActiveArtboardIndex();
        var abObj = doc.artboards[idx];
        var rect = abObj.artboardRect; // [left, top, right, bottom]
        var sWaHcmVal = isNaN(sWaH) ? 0 : sWaH;
        // Use the requested artboard size exactly (in cm)
        var desiredW = cm(minWidthCm);
        var desiredH = cm(minHeightCm);
        var currentW = rect[2] - rect[0];
        var currentH = rect[1] - rect[3];
        if (Math.abs(currentW - desiredW) > 0.5 || Math.abs(currentH - desiredH) > 0.5) {
            // Keep top-left fixed, grow to the right and downward
            abObj.artboardRect = [rect[0], rect[1], rect[0] + desiredW, rect[1] - desiredH];
            rect = abObj.artboardRect;
        }
        return rect;
    }

    var ab = ensureArtboardMinSize(120, 150);
    var originX = ab[0] + cm(MARGIN_X_CM);
    var originY = ab[1] - cm(MARGIN_Y_CM);
    function toArt(pt) { return [originX + pt[0], originY - pt[1]]; }

    // Fit artboard in window, then center view near the origin so the baseline is in sight
    try { app.executeMenuCommand('fitinwindow'); } catch (e0) {}
    
    // Center after fitting
    try {
        var centerYOffset = isNaN(sWaH) ? cm(20) : cm(Math.min(sWaH / 2, 45));
        var centerPt = [originX, originY - centerYOffset];
        doc.activeView.centerPoint = centerPt;
    } catch (e) {}

    function drawMarker(ptDraft, num, color) {
        var pt = toArt(ptDraft), r = cm(MARKER_RADIUS_CM);
        var circle = markersGroup.pathItems.ellipse(pt[1] + r, pt[0] - r, r * 2, r * 2);
        try { circle.name = 'Marker ' + num; } catch (eMk1) {}
        circle.stroked = true;
        circle.strokeColor = color;
        circle.filled = true;
        circle.fillColor = color;

        var tf = numbersGroup.textFrames.add();
        tf.contents = String(num);
        try { tf.name = 'Marker ' + num + ' Number'; } catch (eMkN1) {}
        tf.textRange.characterAttributes.size = NUMBER_FONT_SIZE_PT;
        tf.textRange.characterAttributes.fillColor = makeRGB(255, 255, 255);
        // Center the text frame over the point if bounds are available
        try {
            tf.left = pt[0] - (tf.width / 2);
            tf.top  = pt[1] + (tf.height / 2);
        } catch (eCenter1) {
            // Fallback to previous offsets
            tf.left = pt[0] - (num >= 10 ? 3.5 : 2.5);
            tf.top  = pt[1] + 3;
        }
        // Ensure text is above the circle
        try { circle.zOrder(ZOrderMethod.SENDTOBACK); } catch (eZ1) {}
        try { tf.zOrder(ZOrderMethod.BRINGTOFRONT); } catch (eZ2) {}
    }

    // Letter-only marker on chosen layer's Numbers group (no circle)
    function placeLetterOn(layerName, ptDraft, letter) {
        try {
            var bundle = bundleFor(layerName);
            var tf = bundle.numbers.textFrames.add();
            tf.contents = String(letter);
            try { tf.name = 'Letter ' + String(letter); } catch (eNmLet) {}
            tf.textRange.characterAttributes.size = NUMBER_FONT_SIZE_PT;
            tf.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
            var p = toArt(ptDraft);
            tf.left = p[0];
            tf.top  = p[1];
            return tf;
        } catch (eLet) {}
        return null;
    }

    function drawLabel(ptDraft, textStr) {
        var pt = toArt(ptDraft);
        var tf = LABELS_DIM_GROUP.textFrames.add();
        tf.contents = textStr;
        try { tf.name = textStr + ' label'; } catch (eNmL) {}
        tf.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
        tf.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
        tf.left = pt[0] + cm(0.1);
        tf.top  = pt[1] - cm(0.1);
    }

    function drawLine(pDraftA, pDraftB, color, widthPt) {
        var pA = toArt(pDraftA);
        var pB = toArt(pDraftB);
        var line = linesGroup.pathItems.add();
        line.setEntirePath([pA, pB]);
        line.stroked = true;
        line.strokeWidth = widthPt || 1;
        line.strokeColor = color || makeRGB(0, 0, 0);
        line.filled = false;
    }

    // ---- Generalized helpers (no drawing invoked here) ----
    function layerColor(name) {
        if (name === 'Basic Frame') return COLOR_FRAME;
        if (name === 'Front Construction') return COLOR_FRONT;
        if (name === 'Back Construction') return COLOR_BACK;
        return makeRGB(0, 0, 0);
    }

    function bundleFor(name) {
        return LAYERS[name] || LAYERS['Basic Frame'];
    }

    // Solid line on chosen layer
    function drawLineOn(layerName, pDraftA, pDraftB, widthPt, name) {
        var bundle = bundleFor(layerName);
        var pA = toArt(pDraftA), pB = toArt(pDraftB);
        var line = bundle.lines.pathItems.add();
        line.setEntirePath([pA, pB]);
        line.stroked = true;
        line.strokeWidth = widthPt || 1;
        line.strokeColor = layerColor(layerName);
        line.filled = false;
        try { if (name) line.name = name; } catch (eNmLn) {}
        return line;
    }

    // Dashed line (12pt dash, 4pt gap) on chosen layer
    function drawDashedLineOn(layerName, pDraftA, pDraftB, widthPt, name) {
        var path = drawLineOn(layerName, pDraftA, pDraftB, widthPt || 1, name);
        try { path.strokeDashes = [16, 5]; } catch (e) {}
        return path;
    }

    // Dotted line on chosen layer
    function drawDottedLineOn(layerName, pDraftA, pDraftB, widthPt, name) {
        var path = drawLineOn(layerName, pDraftA, pDraftB, widthPt || 1, name);
        try { path.strokeCap = StrokeCap.ROUNDENDCAP; } catch (eCap) {}
        try { path.strokeDashes = [1, 6]; } catch (eDash) {}
        return path;
    }

    // Single cubic Bezier between two anchors with explicit handle endpoints (draft coords)
    function drawCubicBetweenOn(layerName, pA, pB, handleOutA, handleInB, widthPt, name) {
        var bundle = bundleFor(layerName);
        var aA = toArt(pA), aB = toArt(pB);
        var hA = toArt(handleOutA), hB = toArt(handleInB);
        var path = bundle.lines.pathItems.add();
        path.setEntirePath([aA, aB]);
        path.stroked = true;
        path.filled = false;
        path.strokeWidth = widthPt || 1;
        path.strokeColor = layerColor(layerName);
        try { if (name) path.name = name; } catch (eNmCbz) {}
        try {
            var pp0 = path.pathPoints[0];
            var pp1 = path.pathPoints[1];
            pp0.leftDirection  = pp0.anchor;
            pp0.rightDirection = hA;
            pp0.pointType = PointType.SMOOTH;
            pp1.rightDirection = pp1.anchor;
            pp1.leftDirection  = hB;
            pp1.pointType = PointType.SMOOTH;
        } catch (ePPc) {}
        return path;
    }


    // Global point numbering across the draft
    var __POINT_COUNTER = 1;
    function nextPointNumber() { return __POINT_COUNTER++; }

    // Marker on chosen layer, using global numbering if num is null
    function drawMarkerOn(layerName, ptDraft, num) {
        var n = (num != null) ? num : nextPointNumber();
        var r = cm(MARKER_RADIUS_CM);
        var pt = toArt(ptDraft);
        var bundle = bundleFor(layerName);
        var color = layerColor(layerName);

        var circle = bundle.markers.pathItems.ellipse(pt[1] + r, pt[0] - r, r * 2, r * 2);
        try { circle.name = 'Marker ' + n; } catch (eMk2) {}
        circle.stroked = true;
        circle.strokeColor = color;
        circle.filled = true;
        circle.fillColor = color;

        var tf = bundle.numbers.textFrames.add();
        tf.contents = String(n);
        try { tf.name = 'Marker ' + n + ' Number'; } catch (eMkN2) {}
        tf.textRange.characterAttributes.size = NUMBER_FONT_SIZE_PT;
        tf.textRange.characterAttributes.fillColor = makeRGB(255, 255, 255);
        try {
            tf.left = pt[0] - (tf.width / 2);
            tf.top  = pt[1] + (tf.height / 2);
        } catch (eCenter2) {
            tf.left = pt[0] - (n >= 10 ? 3.5 : 2.5);
            tf.top  = pt[1] + 3;
        }
        try { circle.zOrder(ZOrderMethod.SENDTOBACK); } catch (eZ3) {}
        try { tf.zOrder(ZOrderMethod.BRINGTOFRONT); } catch (eZ4) {}
        return n;
    }

    // Label parallel to a reference line (pA->pB), offset by LABEL_OFFSET_CM to the right side
    // Units: input points should be provided via cm() externally; this helper treats them as draft cm converted before toArt.
    function drawLabelParallelOn(layerName, pDraftA, pDraftB, textStr, offsetCm) {
        // Labels live on the dedicated layer and are black
        var off = (offsetCm != null) ? offsetCm : LABEL_OFFSET_CM;

        // Compute midpoint and normal (draft coords, cm)
        var dx = (pDraftB[0] - pDraftA[0]);
        var dy = (pDraftB[1] - pDraftA[1]);
        var len = Math.sqrt(dx*dx + dy*dy) || 1;
        var nx =  dy / len; // right-hand normal
        var ny = -dx / len;
        var mid = [ (pDraftA[0] + pDraftB[0]) / 2 + nx * cm(off),
                    (pDraftA[1] + pDraftB[1]) / 2 + ny * cm(off) ];

        // Page angle is inverted because toArt flips Y
        var angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
        var pageAngle = -angleDeg;

        var pt = toArt(mid);
        var tf = LABELS_DIM_GROUP.textFrames.add();
        tf.contents = textStr;
        try { tf.name = textStr + ' label'; } catch (eNmLP) {}
        tf.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
        tf.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
        tf.left = pt[0];
        tf.top  = pt[1];
        try { tf.rotate(pageAngle); } catch (e) {}
        return tf;
    }

    // Label a line just below it, placed near the left side, and parallel to the line.
    // alongFromLeftCm: distance along the line from its left/start point (pDraftA)
    // belowCm: perpendicular offset below the line (in visual/page space)
    function drawLabelBelowOn(layerName, pDraftA, pDraftB, textStr, alongFromLeftCm, belowCm) {
        // Labels live on the dedicated layer and are black

        var dx = (pDraftB[0] - pDraftA[0]);
        var dy = (pDraftB[1] - pDraftA[1]);
        var len = Math.sqrt(dx*dx + dy*dy) || 1;
        var ux = dx / len; // unit tangent (draft coords)
        var uy = dy / len;

        // Two candidate normals in draft coords
        var nx1 =  uy, ny1 = -ux;   // right-hand
        var nx2 = -uy, ny2 =  ux;   // left-hand

        // Choose the one that is visually below (greater page Y after toArt)
        var mid = [ (pDraftA[0] + pDraftB[0]) / 2, (pDraftA[1] + pDraftB[1]) / 2 ];
        var test1 = toArt([ mid[0] + nx1 * cm(0.2), mid[1] + ny1 * cm(0.2) ]);
        var test2 = toArt([ mid[0] + nx2 * cm(0.2), mid[1] + ny2 * cm(0.2) ]);
        var nx = nx1, ny = ny1;
        // Choose the direction that lands lower on the page (smaller page Y)
        if (test2[1] < test1[1]) { nx = nx2; ny = ny2; }

        // Anchor near left: move along from pDraftA, then below by belowCm
        var base = [ pDraftA[0] + ux * cm(alongFromLeftCm), pDraftA[1] + uy * cm(alongFromLeftCm) ];
        var pos  = [ base[0] + nx * cm(belowCm), base[1] + ny * cm(belowCm) ];

        var angleDeg = Math.atan2(dy, dx) * 180 / Math.PI; // draft angle
        var pageAngle = -angleDeg; // adjust for toArt Y flip

        var pt = toArt(pos);
        var tf = LABELS_DIM_GROUP.textFrames.add();
        tf.contents = textStr;
        try { tf.name = textStr + ' label'; } catch (eNmLB) {}
        tf.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
        tf.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
        tf.left = pt[0];
        tf.top  = pt[1];
        try { tf.rotate(pageAngle); } catch (e) {}
        return tf;
    }

    // ---- Draft: Basic Frame - Line 1-2 from origin downwards by sWaH ----
    try {
        if (!isNaN(sWaH)) {
            // Line from point 1 (origin) to point 2 (downwards by sWaH)
            drawLineOn('Basic Frame', [0, 0], [0, cm(sWaH)], 1, 'Side Waist Height (sWaH)');
            // Markers with explicit numbering 1 and 2
            drawMarkerOn('Basic Frame', [0, 0], 1);
            drawMarkerOn('Basic Frame', [0, cm(sWaH)], 2);

            // From point 1, mark down 1 cm (or 1.5 cm if Hip Profile is Curvy) and label 3
            var __isCurvyHip = (hipProfile && hipProfile.toLowerCase() === 'curvy');
            var __hipDrop = cm(__isCurvyHip ? 1.5 : 1);
            drawMarkerOn('Basic Frame', [0, __hipDrop], 3);
            // Square waist line across full span: -30cm to +50cm on Basic Frame
            drawDashedLineOn('Basic Frame', [ -cm(30), __hipDrop ], [ cm(50), __hipDrop ], 1, 'front waist line');

            // Mark 6 upwards from 2 by the hem reduction, then square right 50cm and label/name it "hem line"
            if (!isNaN(sWaH)) {
                var __hemYcm = Math.max(0, sWaH - Math.max(0, HemShorten || 0));
                var __p6 = [0, cm(__hemYcm)];
                // Avoid drawing marker 6 if it coincides with point 2 (same line)
                var __sameAs2 = Math.abs(__hemYcm - sWaH) < 1e-6;
                if (!__sameAs2) {
                    drawMarkerOn('Basic Frame', __p6, 6);
                }
                var __p6r = [cm(50), cm(__hemYcm)];
                // Hem Line across full span: -30cm to +50cm on Basic Frame
                drawDashedLineOn('Basic Frame', [ -cm(30), cm(__hemYcm) ], __p6r, 1, 'Hem Line');
                try {
                    var __heLbl = toArt([ cm(15), cm(__hemYcm - 0.7) ]);
                    var __tfHe = LABELS_DIM_GROUP.textFrames.add();
                    __tfHe.contents = 'Hem Line';
                    try { __tfHe.name = 'Hem Line label'; } catch (eNmHe) {}
                    __tfHe.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
                    __tfHe.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                    __tfHe.left = __heLbl[0];
                    __tfHe.top  = __heLbl[1];
                } catch (eLblHem) {}
            }

            // Square out to the right from point 1 by 10cm (single dashed construction line)
            drawDashedLineOn('Basic Frame', [0, 0], [cm(10), 0], 1, 'Increased Waist Line');

            // Mark on sWaH line at (CrH - reduction) from 1, label 4, then square right 50cm (dashed)
            if (!isNaN(CrH)) {
                var __len = Math.max(0, CrH - CrHReduction);
                var __p4 = [0, cm(__len)];
                drawMarkerOn('Basic Frame', __p4, 4);
                // Crotch Line across full span: -30cm to +50cm on Basic Frame
                var __p4r = [cm(50), cm(__len)];
                drawDashedLineOn('Basic Frame', [ -cm(30), cm(__len) ], __p4r, 1, 'Crotch Line');
                drawDashedLineOn('Front Construction', [ -cm(30), cm(__len) ], __p4r, 1, 'Front Crotch Line');
                drawDashedLineOn('Back Construction', [ -cm(30), cm(__len) ], __p4r, 1, 'Back Crotch Line');
                // Label "Crotch Line" above the line: from sWaH edge, 5cm right, 0.2cm up
                try {
                    var __cLbl = toArt([ cm(10), cm(__len - 0.7) ]);
                    var __tfC = LABELS_DIM_GROUP.textFrames.add();
                    __tfC.contents = 'Crotch Line';
                    try { __tfC.name = 'Crotch Line label'; } catch (eNmCL) {}
                    __tfC.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
                    __tfC.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                    __tfC.left = __cLbl[0];
                    __tfC.top  = __cLbl[1];
                } catch (eLblCrotch) {}

                // From 4, mark down KnH to get point 5, then draw Knee Line across full span and label
                if (!isNaN(KnH)) {
                    var __p5 = [0, cm(__len + KnH)];
                    drawMarkerOn('Basic Frame', __p5, 5);
                    var __p5r = [cm(50), cm(__len + KnH)];
                    // Knee Line across full span: -30cm to +50cm on Basic Frame
                    drawDashedLineOn('Basic Frame', [ -cm(30), cm(__len + KnH) ], __p5r, 1, 'knee line');
                    drawDashedLineOn('Front Construction', [ -cm(30), cm(__len + KnH) ], __p5r, 1, 'Front Knee Line');
                    drawDashedLineOn('Back Construction', [ -cm(30), cm(__len + KnH) ], __p5r, 1, 'Back Knee Line');
                    // Label "Knee Line" above the line: from sWaH edge, 5cm right, 0.2cm up
                    try {
                        var __kLbl = toArt([ cm(10), cm((__len + KnH) - 0.7) ]);
                        var __tfK = LABELS_DIM_GROUP.textFrames.add();
                        __tfK.contents = 'Knee Line';
                        try { __tfK.name = 'Knee Line label'; } catch (eNmKL) {}
                        __tfK.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
                        __tfK.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                        __tfK.left = __kLbl[0];
                        __tfK.top  = __kLbl[1];
                    } catch (eLblKnee) {}
                }

                // From 4, mark up by (HiC/20) + 3 cm to get point 7; draw Hip Line across full span
                if (!isNaN(HiC)) {
                    var __hipRise = (HiC / 20) + 3; // cm
                    var __y7 = Math.max(0, __len - __hipRise);
                var __p7 = [0, cm(__y7)];
                try { if ($.global.measurements) $.global.measurements.FrontHipDropCm = Math.max(0, __y7); } catch (eStoreHip) {}
                drawMarkerOn('Basic Frame', __p7, 7);
                // From 7, mark out 8 to the right; default fTrW = (HiC/4) - 1 cm, or (WaC/4) + 2 cm if tummy profile is Fuller
                var __tummyChoiceFront = (tummyProfile || '').toLowerCase();
                var __fTrWBase = (__tummyChoiceFront === 'fuller') ? ((WaC / 4) + 2) : ((HiC / 4) - 1);
                if (isNaN(__fTrWBase)) __fTrWBase = 0;
                var __fTrW = Math.max(0, __fTrWBase);
                var __p8 = [cm(__fTrW), cm(__y7)];
                drawMarkerOn('Basic Frame', __p8, 8);

                // Compute front crotch extension from 8: (fTrW/4) +/- user adjust
                var __ext = (__fTrW / 4) + (CrotchExtAdjust || 0);
                var __p10 = [cm(Math.max(0, __fTrW + __ext)), cm(__y7)];
                drawMarkerOn('Front Construction', __p10, 10);

                // Hip Line across full span: -30cm to +50cm on Basic Frame (restores beyond point 10)
                drawDashedLineOn('Basic Frame', [ -cm(30), cm(__y7) ], [ cm(50), cm(__y7) ], 1, 'Hip Line');
                drawDashedLineOn('Front Construction', [ -cm(30), cm(__y7) ], [ cm(50), cm(__y7) ], 1, 'Front Hip Line');
                drawDashedLineOn('Back Construction', [ -cm(30), cm(__y7) ], [ cm(50), cm(__y7) ], 1, 'Back Hip Line (Frame)');

                // Mark 11 exactly at the midpoint between 7 and 10
                try {
                    var __p11 = [ (__p7[0] + __p10[0]) / 2, __p7[1] ];
                    drawMarkerOn('Front Construction', __p11, 11);
                } catch (e11) {}

                // Mark 12 on the hem (or sWaH if no reduction) so that 6-12 equals 7-11 (i.e., x equals midpoint x)
                try {
                    var __x12 = (__p10[0] - __p7[0]) / 2; // midpoint X in points
                    var __yHemPts = cm(__hemYcm);        // hem Y in points
                    var __p12 = [ __x12, __yHemPts ];
                    drawMarkerOn('Front Construction', __p12, 12);

                    // Where this vertical passes the knee line is 13
                    if (!isNaN(KnH)) {
                        var __yKneePts = cm(__len + KnH);
                        var __p13 = [ __x12, __yKneePts ];
                        drawMarkerOn('Front Construction', __p13, 13);
                    }

                    // Extend the straight (squared up) line from 12 to the waistline, mark 14
                    var __p14 = [ __x12, __hipDrop ];
                    try {
                        if ($.global.measurements) {
                            $.global.measurements.FrontWaistDx = __p14[0] - __p21[0];
                            $.global.measurements.FrontWaistDy = __p14[1] - __p21[1];
                        }
                    } catch (eStoreWaistVec) {}
                    // Draw the centre/grain/crease line as dashed
                    drawDashedLineOn('Front Construction', __p12, __p14, 1, 'Centre Line/ Grain Line/ Crease');
                    // Place label relative to point 12: go up by 45cm and right by 0.2cm
                    try {
                        var __angleDeg = Math.atan2((__p14[1] - __p12[1]), (__p14[0] - __p12[0])) * 180 / Math.PI; // draft angle
                        var __pageAngle = -__angleDeg; // adjust for toArt Y flip
                        var __labelDraft = [ __p12[0] - cm(1.5), __p12[1] - cm(45) ]; // left 1.5cm, up 45cm from point 12
                        var __labelPt = toArt(__labelDraft);
                        var __tf = LABELS_DIM_GROUP.textFrames.add();
                        __tf.contents = 'Centre Line/ Grain Line/ Crease';
                        try { __tf.name = 'Centre Line/ Grain Line/ Crease label'; } catch (eNmGr) {}
                        __tf.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
                        __tf.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                        __tf.left = __labelPt[0];
                        __tf.top  = __labelPt[1];
                        try { __tf.rotate(__pageAngle); } catch (eRotGr) {}
                    } catch (eLblGr) {}

                    // === Back Construction: Points 24 and Centre Line/ Grain Line/ Crease ===
                    try {
                        // Ensure reference points 11 and 13 exist; compute if missing
                        if ((typeof __p11 === 'undefined' || !__p11) && typeof __p7 !== 'undefined' && typeof __p10 !== 'undefined' && __p7 && __p10) {
                            __p11 = [ (__p7[0] + __p10[0]) / 2, __p7[1] ];
                        }
                        if ((typeof __p13 === 'undefined' || !__p13) && !isNaN(KnH)) {
                            var __midX = (typeof __p7 !== 'undefined' && typeof __p10 !== 'undefined' && __p7 && __p10) ? ((__p10[0] - __p7[0]) / 2) : 0;
                            __p13 = [ __midX, cm(__len + KnH) ];
                        }

                        if (typeof __p11 !== 'undefined' && __p11 && typeof __p13 !== 'undefined' && __p13) {
                            // Offset for point 24: default 2cm; if fuller buttocks, 1cm
                            var __isFuller = (profile && profile.toLowerCase && profile.toLowerCase() === 'full');
                            var __off24 = cm(__isFuller ? 1 : 2);
                            var __p24 = [ __p11[0] + __off24, __p11[1] ];
                            drawMarkerOn('Back Construction', __p24, 24);

                            // Build a single Back Centre Line/ Grain Line/ Crease path from 13 through 24 up to the waist (y = __hipDrop)
                            if (typeof __hipDrop !== 'undefined') {
                                var __x13 = __p13[0], __y13 = __p13[1];
                                var __x24 = __p24[0], __y24 = __p24[1];
                                var __vx = __x24 - __x13, __vy = __y24 - __y13;
                                if (Math.abs(__vy) > 1e-6) {
                                    var __tW = (__hipDrop - __y13) / __vy;
                                    var __xW = __x13 + __vx * __tW;
                                    var __pW = [ __xW, __hipDrop ];
                                    try {
                                        var __bcPath = LAYERS['Back Construction'].lines.pathItems.add();
                                        __bcPath.setEntirePath([ toArt(__p13), toArt(__p24), toArt(__pW) ]);
                                        __bcPath.stroked = true; __bcPath.filled = false; __bcPath.strokeWidth = 1;
                                        try { __bcPath.name = 'Back Centre Line/ Grain Line/ Crease'; } catch (eNmBC) {}
                                        try { __bcPath.strokeDashes = [16, 5]; } catch (eDashBC) {}
                                        try { __bcPath.strokeColor = layerColor('Back Construction'); } catch (eClrBC) {}
                                    } catch (eBC) {}
                                    try { drawLabelParallelOn('Back Construction', __p13, __p24, 'Centre Line/ Grain Line/ Crease', 0.28); } catch (eLblBC) {}
                                } else {
                                    // Fallback: draw the Centre/Grain line as two dashed segments
                                    var __pW = [ __p24[0], __hipDrop ];
                                    drawDashedLineOn('Back Construction', __p13, __p24, 1, 'Back Centre Line/ Grain Line/ Crease');
                                    drawDashedLineOn('Back Construction', __p24, __pW, 1, 'Back Centre Line/ Grain Line/ Crease');
                                    try { drawLabelParallelOn('Back Construction', __p13, __p24, 'Centre Line/ Grain Line/ Crease', 0.28); } catch (eLblBCFallback) {}
                                }

                                try {
                                    if (typeof __p12 !== 'undefined' && __p12) {
                                        drawDashedLineOn('Back Construction', __p13, __p12, 1, 'Back Centre Line/ Grain Line/ Crease to Hem');
                                    }
                                } catch (eBackCreaseHem) {}
                            }

                            // From 24, mark out 25 to the right by default (bTrW/4); use WaC-driven width only for Fuller tummy.
                            // If user did not enter a Back Crotch Extension Adjustment, adjust by profile/hip rules:
                            //  - Flat buttocks + Curvy hip: +1 cm
                            //  - Full buttocks + Flat hip:  -1 cm
                            try {
                                var __tummyChoice = (tummyProfile || '').toLowerCase();
                                var __bTrWBase = (__tummyChoice === 'fuller') ? ((WaC / 4) - 1.8) : ((HiC / 4) + 1);
                                if (isNaN(__bTrWBase)) __bTrWBase = 0;
                                var __bTrW = Math.max(0, __bTrWBase); // back trouser width heuristic
                                var __autoAdj = 0;
                                var __prof = (profile || '').toLowerCase();
                                var __hip = (hipProfile || '').toLowerCase();
                                if (!BackCrotchExtUserProvided) {
                                    if (__prof === 'flat' && __hip === 'curvy') __autoAdj = 1;
                                    else if (__prof === 'full' && __hip === 'flat') __autoAdj = -1;
                                }
                                var __userAdj = BackCrotchExtUserProvided ? (BackCrotchExtAdjust || 0) : 0;
                                var __ext25 = (__bTrW / 4) + (BackCrotchExtUserProvided ? __userAdj : __autoAdj);
                                if (__ext25 < 0) __ext25 = 0;
                                var __p25 = [ __p24[0] + cm(__ext25), __p24[1] ];
                                drawMarkerOn('Back Construction', __p25, 25);

                                // Through 25, draw a line such that the angle on the left equals BuA.
                                // Draw upwards to 10cm above the waist, and downwards to the crotch line.
                                try {
                                    var __angleLeftDeg = isNaN(BuA) ? 82 : BuA; // fallback to default if needed
                                    // Build direction vector using math coords (y up), then flip y for draft coords
                                    var __phi = (180 - __angleLeftDeg) * Math.PI / 180; // measured from +x to the up-left direction
                                    var __vx = Math.cos(__phi);
                                    var __vy = -Math.sin(__phi); // flip to draft coords (+y down)
                                    var __norm = Math.sqrt(__vx*__vx + __vy*__vy) || 1;
                                    __vx /= __norm; __vy /= __norm;

                                    // Upwards endpoint: 10cm above waistline (waist y = __hipDrop)
                                    var __pUp = null;
                                    if (typeof __hipDrop !== 'undefined') {
                                        var __yUp = __hipDrop - cm(10);
                                        if (Math.abs(__vy) > 1e-6) {
                                            var __tUp = (__yUp - __p25[1]) / __vy; // move along +v to reach target y
                                            __pUp = [ __p25[0] + __vx * __tUp, __p25[1] + __vy * __tUp ];
                                            // Label this line as 'Back Line' on the labels layer, parallel to the up segment
                                            try { if (__pUp) drawLabelParallelOn('Back Construction', __p25, __pUp, 'Back Line', LABEL_OFFSET_CM); } catch (eLblBackLine) {}
                                        }
                                    }

                                    // Downwards endpoint: to crotch line (y = cm(__len))
                                    var __yCrotch = cm(__len);
                                    if (!isNaN(__yCrotch)) {
                                        if (Math.abs(__vy) > 1e-6) {
                                            // Move opposite direction to go downward along the same infinite line
                                            var __tDn = (__yCrotch - __p25[1]) / (-__vy);
                                            var __pDn = [ __p25[0] + (-__vx) * __tDn, __p25[1] + (-__vy) * __tDn ];
                                            // After both endpoints are known, draw a single dashed 'Buttocks Angle' path through 25
                                            try {
                                                if (__pUp) {
                                                    var __buPath = LAYERS['Back Construction'].lines.pathItems.add();
                                                    __buPath.setEntirePath([ toArt(__pUp), toArt(__p25), toArt(__pDn) ]);
                                                    __buPath.stroked = true; __buPath.filled = false; __buPath.strokeWidth = 1;
                                                    try { __buPath.name = 'Buttocks Angle'; } catch (eNmBU) {}
                                                    try { __buPath.strokeDashes = [16, 5]; } catch (eDashBU) {}
                                                    try { __buPath.strokeColor = layerColor('Back Construction'); } catch (eClrBU) {}
                                                } else {
                                                    drawDashedLineOn('Back Construction', __p25, __pDn, 1, 'Buttocks Angle');
                                                }
                                            } catch (eBuJoin) {}

                                            // Back Hip Line: from back line to hip line, perpendicular to back line, length = bTrW
                                            try {
                                                var __yHipPts = (typeof __y7 !== 'undefined') ? cm(__y7) : (__p7 ? __p7[1] : null);
                                                if (!isNaN(__yHipPts)) {
                                                    // Unit vectors along back line (__v) and its right-hand normal (__n)
                                                    var __v = [ __vx, __vy ];
                                                    var __n = [ -__vy, __vx ];
                                                    var __nLen = Math.sqrt(__n[0]*__n[0] + __n[1]*__n[1]) || 1; __n[0]/=__nLen; __n[1]/=__nLen;

                                                    // Desired segment length (points)
                                                    var __tummyChoiceB = (tummyProfile || '').toLowerCase();
                                                    var __bTrWcmBase = (__tummyChoiceB === 'fuller') ? ((WaC / 4) - 1.8) : ((HiC / 4) + 1);
                                                    if (isNaN(__bTrWcmBase)) __bTrWcmBase = 0;
                                                    var __bTrWcm = Math.max(0, __bTrWcmBase);
                                                    var __L = cm(__bTrWcm);

                                                    function __solveBHL(sign) {
                                                        var s = sign * __L;
                                                        if (Math.abs(__v[1]) < 1e-6) return null; // avoid divide by zero
                                                        var t = (__yHipPts - __p25[1] - s*__n[1]) / __v[1];
                                                        var p27 = [ __p25[0] + __v[0]*t, __p25[1] + __v[1]*t ];
                                                        var p28 = [ p27[0] + __n[0]*s, p27[1] + __n[1]*s ];
                                                        return { p27: p27, p28: p28, s: s, t: t };
                                                    }

                                                    var __candA = __solveBHL( 1);
                                                    var __candB = __solveBHL(-1);
                                                    function __pref(c) {
                                                        if (!c) return -1;
                                                        var leftOf = (c.p28[0] < c.p27[0]);
                                                        var fromAbove = (c.p27[1] < __yHipPts); // p27 above hip line in draft coords
                                                        // Highest score to candidates satisfying both constraints
                                                        return (leftOf ? 2 : 0) + (fromAbove ? 1 : 0);
                                                    }
                                                    var __scoreA = __pref(__candA);
                                                    var __scoreB = __pref(__candB);
                                                    var __use = (__scoreA >= __scoreB) ? __candA : __candB;
                                                    if (__use) {
                                                        drawMarkerOn('Back Construction', __use.p27, 27);
                                                        drawMarkerOn('Back Construction', __use.p28, 28);
                                                        // Draw dashed Back Hip Line
                                                        drawDashedLineOn('Back Construction', __use.p27, __use.p28, 1.2, 'Back Hip Line');
                                                        // Label: centered at midpoint, 0.5cm above (visually), upright text
                                                        try {
                                                            var __dxB = (__use.p28[0] - __use.p27[0]);
                                                            var __dyB = (__use.p28[1] - __use.p27[1]);
                                                            var __lenB = Math.sqrt(__dxB*__dxB + __dyB*__dyB) || 1;
                                                            var __uxB = __dxB / __lenB, __uyB = __dyB / __lenB;
                                                            // Two normals in draft coords
                                                            var __nx1 =  __uyB, __ny1 = -__uxB; // right-hand
                                                            var __nx2 = -__uyB, __ny2 =  __uxB; // left-hand
                                                            var __midB = [ (__use.p27[0] + __use.p28[0]) / 2, (__use.p27[1] + __use.p28[1]) / 2 ];
                                                            var __candAbove1 = toArt([ __midB[0] + __nx1 * cm(0.5), __midB[1] + __ny1 * cm(0.5) ]);
                                                            var __candAbove2 = toArt([ __midB[0] + __nx2 * cm(0.5), __midB[1] + __ny2 * cm(0.5) ]);
                                                            // Choose the normal that places the label visually above (larger page Y)
                                                            var __chooseN = (__candAbove1[1] > __candAbove2[1]) ? [__nx1, __ny1] : [__nx2, __ny2];
                                                            var __labelPosDraft = [ __midB[0] + __chooseN[0] * cm(0.5), __midB[1] + __chooseN[1] * cm(0.5) ];
                                                            var __ptLab = toArt(__labelPosDraft);
                                                            var __tfB = LABELS_DIM_GROUP.textFrames.add();
                                                            __tfB.contents = 'Hip Line ' + __bTrWcm.toFixed(2) + 'cm';
                                                            try { __tfB.name = 'Hip Line label'; } catch (eNmBHL) {}
                                                            __tfB.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
                                                            __tfB.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                                                            // Rotate parallel to the line, but ensure upright
                                                            var __angleDegB = Math.atan2(__dyB, __dxB) * 180 / Math.PI;
                                                            var __pageAngB = -__angleDegB;
                                                            if (__pageAngB > 90) __pageAngB -= 180; if (__pageAngB < -90) __pageAngB += 180;
                                                            __tfB.left = __ptLab[0];
                                                            __tfB.top  = __ptLab[1];
                                                            try { __tfB.rotate(__pageAngB); } catch (eRotBHL) {}
                                                            // Center the label over its bounds
                                                            try { __tfB.left = __ptLab[0] - (__tfB.width / 2); __tfB.top = __ptLab[1] + (__tfB.height / 2); } catch (eCtrBHL) {}
                                                        } catch (eLblBHL) {}
                                                    }
                                                    
                                                    // Point 29: measure 24->28 along the hip line and lay off the same distance to the right from 24
                                                    try {
                                                        if (typeof __p24 !== 'undefined' && __p24 && __use && __use.p28) {
                                                            var __d2428 = Math.abs(__use.p28[0] - __p24[0]);
                                                            var __p29 = [ __p24[0] + __d2428, (typeof __y7 !== 'undefined') ? cm(__y7) : __p24[1] ];
                                                            drawMarkerOn('Back Construction', __p29, 29);
                                                        }
                                                    } catch (e29) {}

                                                }
                                            } catch (eBackHipLine) {}
                                        }
                                    }
                                } catch (eBuALine) {}
                            } catch (e25) {}

                        }
                    } catch (eBack24) {}

                    // Draw Hem line centered at 12: length each side = (HEM/4) - 1 cm. Name it 'Hem'.
                    try {
                        var __halfHem = Math.max(0, (HEM / 4) - 1); // cm
                        var __p15 = [ __x12 - cm(__halfHem), __yHemPts ];
                        var __p16 = [ __x12 + cm(__halfHem), __yHemPts ];
                        drawMarkerOn('Front Construction', __p15, 15);
                        drawMarkerOn('Front Construction', __p16, 16);
                        drawLineOn('Front Construction', __p15, __p16, 1, 'Front Hem 15-16');
                        var __backHemOffset = cm(2);
                        var __p15BackHem = [ __p15[0] - __backHemOffset, __p15[1] ];
                        var __p16BackHem = [ __p16[0] + __backHemOffset, __p16[1] ];
                        drawLineOn('Back Construction', __p15BackHem, __p16BackHem, 1, 'Back Hem 15Off-16Off');
                    } catch (eHem) {}

                    // Square up from 15 and 16 by the input value; create 15a and 16a, then build leg seams
                    try {
                        var __sq = cm(Math.max(0, SquareUpLen));
                        var __p15a = [ __p15[0], __p15[1] - __sq ];
                        var __p16a = [ __p16[0], __p16[1] - __sq ];
                        drawLineOn('Front Construction', __p15, __p15a, 1, '15 to 15a');
                        drawLineOn('Front Construction', __p16, __p16a, 1, '16 to 16a');
                        drawMarkerOn('Front Construction', __p15a, '15a');
                        drawMarkerOn('Front Construction', __p16a, '16a');

                        var __yKneePts = !isNaN(KnH) ? cm(__len + KnH) : null;
                        var __yCrotchPts = cm(__len);
                        function __placeIntersect(pA, pB, yTarget, label) {
                            if (yTarget == null) return null;
                            var dy = (pB[1] - pA[1]);
                            if (Math.abs(dy) < 1e-6) return null;
                            var t = (yTarget - pA[1]) / dy;
                            if (t < 0 || t > 1) return null;
                            var x = pA[0] + (pB[0] - pA[0]) * t;
                            var pt = [x, yTarget];
                            drawMarkerOn('Front Construction', pt, label);
                            return pt;
                        }
                        var __p19 = __placeIntersect(__p15a, __p7, __yKneePts, 19);
                        var __p3a = __placeIntersect(__p15a, __p7, __yCrotchPts, '3a');

                        var __pt17 = __placeIntersect(__p16a, __p10, __yCrotchPts, 17);
                        var __p18 = __placeIntersect(__p16a, __p10, __yKneePts, 18);

                        if (__p3a) {
                            drawDashedLineOn('Front Construction', __p15a, __p3a, 1, '15a to 3a');
                            drawLineOn('Front Construction', __p3a, __p7, 1, '3a to 7');
                        } else {
                            drawLineOn('Front Construction', __p15a, __p7, 1, '15a to 7');
                        }

                        if (__pt17) {
                            try { if ($.global) $.global.frontPoint17 = __pt17; } catch (eStoreFront17) {}
                            drawDashedLineOn('Front Construction', __p16a, __pt17, 1, '16a to 17');
                            drawLineOn('Front Construction', __pt17, __p10, 1, '17 to 10');
                        } else {
                            drawLineOn('Front Construction', __p16a, __p10, 1, '16a to 10');
                        }

                        var __shapeOffset = cm(Math.max(0, LegSeamShape));
                        var __curveTension = 0.35;
                        if (__p18) {
                            var __p23 = [ __p18[0] - __shapeOffset, __p18[1] ];
                            drawMarkerOn('Front Construction', __p23, 23);
                            if (typeof __pt17 !== 'undefined' && __pt17) {
                                var __path2317 = LAYERS['Front Construction'].lines.pathItems.add();
                                __path2317.setEntirePath([ toArt(__p16a), toArt(__p23), toArt(__pt17) ]);
                                __path2317.stroked = true; __path2317.filled = false; __path2317.strokeWidth = 1;
                                try { __path2317.name = 'Side Seam 16a-23-17'; } catch (eNm2317) {}
                                try { __path2317.strokeColor = makeRGB(0, 0, 255); } catch (eClr2317) {}
                                var __pp0 = __path2317.pathPoints[0], __pp1 = __path2317.pathPoints[1], __pp2 = __path2317.pathPoints[2];
                                __pp0.leftDirection = __pp0.anchor; __pp0.rightDirection = __pp0.anchor; __pp0.pointType = PointType.CORNER;
                                __pp2.leftDirection = __pp2.anchor; __pp2.rightDirection = __pp2.anchor; __pp2.pointType = PointType.CORNER;
                                var __vec23to16 = [ __p16a[0] - __p23[0], __p16a[1] - __p23[1] ];
                                var __vec23to17 = [ __pt17[0] - __p23[0], __pt17[1] - __p23[1] ];
                                var __len23to16 = Math.sqrt(__vec23to16[0]*__vec23to16[0] + __vec23to16[1]*__vec23to16[1]) || 1;
                                var __len23to17 = Math.sqrt(__vec23to17[0]*__vec23to17[0] + __vec23to17[1]*__vec23to17[1]) || 1;
                                var __u23to16 = [ __vec23to16[0]/__len23to16, __vec23to16[1]/__len23to16 ];
                                var __u23to17 = [ __vec23to17[0]/__len23to17, __vec23to17[1]/__len23to17 ];
                                var __handle23In = [ __p23[0] + __u23to16[0]*__len23to16*__curveTension, __p23[1] + __u23to16[1]*__len23to16*__curveTension ];
                                var __handle23Out = [ __p23[0] + __u23to17[0]*__len23to17*__curveTension, __p23[1] + __u23to17[1]*__len23to17*__curveTension ];
                                __pp1.leftDirection = toArt(__handle23In);
                                __pp1.rightDirection = toArt(__handle23Out);
                                __pp1.pointType = PointType.SMOOTH;
                            } else {
                                var __line2316 = drawLineOn('Front Construction', __p23, __p16a, 1, '23 to 16a');
                                try { __line2316.strokeColor = makeRGB(0, 0, 255); } catch (eClr2316) {}
                            }
                        }
                        if (__p19) {
                            var __p22 = [ __p19[0] + __shapeOffset, __p19[1] ];
                            drawMarkerOn('Front Construction', __p22, 22);
                            if (typeof __p3a !== 'undefined' && __p3a) {
                                var __path223a = LAYERS['Front Construction'].lines.pathItems.add();
                                __path223a.setEntirePath([ toArt(__p15a), toArt(__p22), toArt(__p3a) ]);
                                __path223a.stroked = true; __path223a.filled = false; __path223a.strokeWidth = 1;
                                try { __path223a.name = 'Side Seam 15a-22-3a'; } catch (eNm223a) {}
                                try { __path223a.strokeColor = makeRGB(0, 0, 255); } catch (eClr223a) {}
                                var __qq0 = __path223a.pathPoints[0], __qq1 = __path223a.pathPoints[1], __qq2 = __path223a.pathPoints[2];
                                __qq0.leftDirection = __qq0.anchor; __qq0.rightDirection = __qq0.anchor; __qq0.pointType = PointType.CORNER;
                                __qq2.leftDirection = __qq2.anchor; __qq2.rightDirection = __qq2.anchor; __qq2.pointType = PointType.CORNER;
                                var __vec22to15 = [ __p15a[0] - __p22[0], __p15a[1] - __p22[1] ];
                                var __vec22to3a = [ __p3a[0] - __p22[0], __p3a[1] - __p22[1] ];
                                var __len22to15 = Math.sqrt(__vec22to15[0]*__vec22to15[0] + __vec22to15[1]*__vec22to15[1]) || 1;
                                var __len22to3a = Math.sqrt(__vec22to3a[0]*__vec22to3a[0] + __vec22to3a[1]*__vec22to3a[1]) || 1;
                                var __u22to15 = [ __vec22to15[0]/__len22to15, __vec22to15[1]/__len22to15 ];
                                var __u22to3a = [ __vec22to3a[0]/__len22to3a, __vec22to3a[1]/__len22to3a ];
                                var __handle22In = [ __p22[0] + __u22to15[0]*__len22to15*__curveTension, __p22[1] + __u22to15[1]*__len22to15*__curveTension ];
                                var __handle22Out = [ __p22[0] + __u22to3a[0]*__len22to3a*__curveTension, __p22[1] + __u22to3a[1]*__len22to3a*__curveTension ];
                                __qq1.leftDirection = toArt(__handle22In);
                                __qq1.rightDirection = toArt(__handle22Out);
                                __qq1.pointType = PointType.SMOOTH;
                            } else {
                                var __line2215 = drawLineOn('Front Construction', __p22, __p15a, 1, '22 to 15a');
                                try { __line2215.strokeColor = makeRGB(0, 0, 255); } catch (eClr2215) {}
                            }
                        }
                        if (typeof __pt17 !== 'undefined' && __pt17 && typeof __p23 !== 'undefined' && __p23) {
                            var __dx1723 = __pt17[0] - __p23[0];
                            var __dy1723 = __pt17[1] - __p23[1];
                            __frontInseam1723 = Math.sqrt(__dx1723*__dx1723 + __dy1723*__dy1723);
                            try { if ($.global.measurements) $.global.measurements.FrontInseam1723 = __frontInseam1723 / cm(1); } catch (eStore1723) {}
                        }
                        // (CF letters/aux lines moved below after 8a and 20 are definitely defined)
                    } catch (eSq) {}
                    
                    // Back guides using front references: points 30, 31 and dashed parallels to hem
                    try {
                        if (typeof __p22 !== 'undefined' && __p22 && typeof __p23 !== 'undefined' && __p23 &&
                            typeof __p15a !== 'undefined' && __p15a && typeof __p16a !== 'undefined' && __p16a &&
                            typeof __p15 !== 'undefined' && __p15 && typeof __p16 !== 'undefined' && __p16) {
                            var __two = cm(2);
                            var __p31 = [ __p23[0] + __two, __p23[1] ];
                            var __p30 = [ __p22[0] - __two, __p22[1] ];
                            drawMarkerOn('Back Construction', __p31, 31);
                            drawMarkerOn('Back Construction', __p30, 30);
                            __backState.use = __use;
                            __backState.hipDrop = __hipDrop;
                            __backState.p31 = __p31;
                            __backState.p30 = __p30;

                            var __p16aOff = [ __p16a[0] + __two, __p16a[1] ];
                            var __p15aOff = [ __p15a[0] - __two, __p15a[1] ];
                            var __p16Off  = [ __p16[0]  + __two, __p16[1]  ];
                            var __p15Off  = [ __p15[0]  - __two, __p15[1]  ];

                            // Right side guide: 31 -> 16a(+2) -> hem right (+2)
                            try {
                                var __gR = LAYERS['Back Construction'].lines.pathItems.add();
                                __gR.setEntirePath([ toArt(__p31), toArt(__p16aOff), toArt(__p16Off) ]);
                                __gR.stroked = true; __gR.filled = false; __gR.strokeWidth = 1;
                                try { __gR.name = 'Back Guide 31-16a-hem'; } catch (eNmGR) {}
                                // solid line (no dashes)
                                try { __gR.strokeDashes = []; } catch (eDR) {}
                                try { __gR.strokeColor = layerColor('Back Construction'); } catch (eClrGR) {}
                                try { var __r0 = __gR.pathPoints[0], __r1 = __gR.pathPoints[1], __r2 = __gR.pathPoints[2];
                                      __r0.leftDirection = __r0.anchor; __r0.rightDirection = __r0.anchor; __r0.pointType = PointType.CORNER;
                                      __r1.leftDirection = __r1.anchor; __r1.rightDirection = __r1.anchor; __r1.pointType = PointType.CORNER;
                                      __r2.leftDirection = __r2.anchor; __r2.rightDirection = __r2.anchor; __r2.pointType = PointType.CORNER; } catch (eCrR) {}
                            } catch (eRG) {}

                            // Left side guide: 30 -> 15a(-2) -> hem left (-2)
                            try {
                                var __gL = LAYERS['Back Construction'].lines.pathItems.add();
                                __gL.setEntirePath([ toArt(__p30), toArt(__p15aOff), toArt(__p15Off) ]);
                                __gL.stroked = true; __gL.filled = false; __gL.strokeWidth = 1;
                                try { __gL.name = 'Back Guide 30-15a-hem'; } catch (eNmGL) {}
                                // solid line (no dashes)
                                try { __gL.strokeDashes = []; } catch (eDL) {}
                                try { __gL.strokeColor = layerColor('Back Construction'); } catch (eClrGL) {}
                                try { var __l0 = __gL.pathPoints[0], __l1 = __gL.pathPoints[1], __l2 = __gL.pathPoints[2];
                                      __l0.leftDirection = __l0.anchor; __l0.rightDirection = __l0.anchor; __l0.pointType = PointType.CORNER;
                                      __l1.leftDirection = __l1.anchor; __l1.rightDirection = __l1.anchor; __l1.pointType = PointType.CORNER;
                                      __l2.leftDirection = __l2.anchor; __l2.rightDirection = __l2.anchor; __l2.pointType = PointType.CORNER; } catch (eCrL) {}
                            } catch (eLG) {}

                            // Connect 29-31 with dashed
                            try {
                                if (typeof __p29 !== 'undefined' && __p29 && __p31) {
                                    drawDashedLineOn('Back Construction', __p29, __p31, 1, '29 to 31');
                                    try {
                                        if (typeof __frontInseam1723 === 'number' && __frontInseam1723 > 0) {
                                            var __vec3129 = [ __p29[0] - __p31[0], __p29[1] - __p31[1] ];
                                            var __len3129 = Math.sqrt(__vec3129[0]*__vec3129[0] + __vec3129[1]*__vec3129[1]);
                                            if (__len3129 > 1e-6) {
                                                var __targetPts = __frontInseam1723 - cm(BackInseamReduction);
                                                if (__targetPts < 0) __targetPts = 0;
                                                if (__targetPts > __len3129) __targetPts = __len3129;
                                                var __u3129 = [ __vec3129[0] / __len3129, __vec3129[1] / __len3129 ];
                                                var __p38 = [ __p31[0] + __u3129[0] * __targetPts, __p31[1] + __u3129[1] * __targetPts ];
                                                drawMarkerOn('Back Construction', __p38, 38);
                                                try { if ($.global.measurements) $.global.measurements.BackInseam38 = __targetPts / cm(1); } catch (eStore38) {}

                                                try {

                                                    if (__targetPts > cm(0.1)) {

                                                        var __vec3138 = [ __p38[0] - __p31[0], __p38[1] - __p31[1] ];

                                                        var __len3138 = Math.sqrt(__vec3138[0]*__vec3138[0] + __vec3138[1]*__vec3138[1]);

                                                        if (__len3138 > 1e-6) {

                                                            var __u3138 = [ __vec3138[0] / __len3138, __vec3138[1] / __len3138 ];

                                                            var __vecOutRef = [ __p31[0] - __p30[0], __p31[1] - __p30[1] ];

                                                            var __proj = (__vecOutRef[0]*__u3138[0]) + (__vecOutRef[1]*__u3138[1]);

                                                            var __outNormal = [ __vecOutRef[0] - __u3138[0]*__proj, __vecOutRef[1] - __u3138[1]*__proj ];

                                                            var __normLen = Math.sqrt(__outNormal[0]*__outNormal[0] + __outNormal[1]*__outNormal[1]);

                                                            if (__normLen < 1e-6) {

                                                                __outNormal = [ -__u3138[1], __u3138[0] ];

                                                                __normLen = Math.sqrt(__outNormal[0]*__outNormal[0] + __outNormal[1]*__outNormal[1]) || 1;

                                                            }

                                                            __outNormal[0] /= __normLen; __outNormal[1] /= __normLen;

                                                            var __vecInside = [ __p29[0] - __p31[0], __p29[1] - __p31[1] ];

                                                            var __dotInside = (__vecInside[0]*__outNormal[0]) + (__vecInside[1]*__outNormal[1]);

                                                            if (__dotInside < 0) { __outNormal[0] *= -1; __outNormal[1] *= -1; }

                                                            var __offset = cm(0.5);

                                                            var __thirdLen = __len3138 / 3;

                                                            var __ctrl31 = [ __p31[0] + __u3138[0]*__thirdLen + __outNormal[0]*__offset, __p31[1] + __u3138[1]*__thirdLen + __outNormal[1]*__offset ];

                                                            var __ctrl38 = [ __p38[0] - __u3138[0]*__thirdLen + __outNormal[0]*__offset, __p38[1] - __u3138[1]*__thirdLen + __outNormal[1]*__offset ];

                                                            try {

                                                                var __curve3138 = LAYERS['Back Construction'].lines.pathItems.add();

                                                                __curve3138.setEntirePath([ toArt(__p31), toArt(__p38) ]);

                                                                __curve3138.stroked = true; __curve3138.filled = false; __curve3138.strokeWidth = 1;

                                                                try { __curve3138.name = 'Back Inseam Curve 31-38'; } catch (eNm3138) {}

                                                                try { __curve3138.strokeColor = layerColor('Back Construction'); } catch (eClr3138) {}

                                                                var __cPt0 = __curve3138.pathPoints[0];

                                                                var __cPt1 = __curve3138.pathPoints[1];

                                                                __cPt0.leftDirection = toArt(__p31);

                                                                __cPt0.rightDirection = toArt(__ctrl31);

                                                                __cPt0.pointType = PointType.SMOOTH;

                                                                __cPt1.leftDirection = toArt(__ctrl38);

                                                                __cPt1.rightDirection = toArt(__p38);

                                                                __cPt1.pointType = PointType.SMOOTH;

                                                            } catch (eCurve3138) {}

                                                        }

                                                    } 

                                                try {
                                                    if (__use && __use.p27 && __p38) {
                                                        var __p27 = __use.p27;
                                                        var __ctrl27Y = __p27[1] + cm(15);
                                                        var __ctrl27 = [ __p27[0], __ctrl27Y ];
                                                        try {
                                                            if ($.global && $.global.frontPoint17) {
                                                                var __pt17g = $.global.frontPoint17;
                                                                var __crotchHandleOffset = cm(4.6); // keep crotch-line offset at 4.6 cm
                                                                __ctrl27[0] = __pt17g[0] - __crotchHandleOffset;
                                                            }
                                                        } catch (eCtrl27Adjust) {}
                                                        var __ctrl38 = [ __p38[0] - cm(2.8), __p38[1] ];
                                                        try {
                                                            var __crotchCurve = LAYERS['Back Construction'].lines.pathItems.add();
                                                            __crotchCurve.setEntirePath([ toArt(__p27), toArt(__p38) ]);
                                                            __crotchCurve.stroked = true;
                                                            __crotchCurve.filled = false;
                                                            __crotchCurve.strokeWidth = 1;
                                                            try { __crotchCurve.name = 'Back Crotch Curve 27-38'; } catch (eNmCrotch) {}
                                                            try { __crotchCurve.strokeColor = layerColor('Back Construction'); } catch (eClrCrotch) {}
                                                            var __cc0 = __crotchCurve.pathPoints[0];
                                                            var __cc1 = __crotchCurve.pathPoints[1];
                                                            __cc0.leftDirection = toArt(__p27);
                                                            __cc0.rightDirection = toArt(__ctrl27);
                                                            __cc0.pointType = PointType.SMOOTH;
                                                            __cc1.leftDirection = toArt(__ctrl38);
                                                            __cc1.rightDirection = toArt(__p38);
                                                            __cc1.pointType = PointType.SMOOTH;
                                                        } catch (eCrotchPath) {}
                                                    }
                                                } catch (eCrotchCurve) {}

                                                } catch (eInseamCurve) {}
                                            }
                                        }
                                    } catch (e38Calc) {}
                                }
                            } catch (e2931) {}

                            // Connect 30 to 28 with dashed and extend to waistline, mark 32
                            try {
                                if (__p30 && typeof __use !== 'undefined' && __use && __use.p28 && typeof __hipDrop !== 'undefined') {
                                    drawDashedLineOn('Back Construction', __p30, __use.p28, 1, '30 to 28');
                                    try {
                                        var __p28 = __use.p28;
                                        if (__p28) {
                                            var __vec3028 = [ __p28[0] - __p30[0], __p28[1] - __p30[1] ];
                                            var __len3028 = Math.sqrt(__vec3028[0]*__vec3028[0] + __vec3028[1]*__vec3028[1]);
                                            if (__len3028 > 1e-6) {
                                                var __u3028 = [ __vec3028[0] / __len3028, __vec3028[1] / __len3028 ];
                                                var __inward = null;
                                                if (__use && __use.p27) {
                                                    __inward = [ __use.p27[0] - __p30[0], __use.p27[1] - __p30[1] ];
                                                } else if (typeof __p31 !== 'undefined' && __p31) {
                                                    __inward = [ __p31[0] - __p30[0], __p31[1] - __p30[1] ];
                                                }
                                                if (__inward) {
                                                    var __inLen = Math.sqrt(__inward[0]*__inward[0] + __inward[1]*__inward[1]);
                                                    if (__inLen > 1e-6) {
                                                        var __projIn = (__inward[0]*__u3028[0]) + (__inward[1]*__u3028[1]);
                                                        __inward[0] -= __u3028[0]*__projIn;
                                                        __inward[1] -= __u3028[1]*__projIn;
                                                        __inLen = Math.sqrt(__inward[0]*__inward[0] + __inward[1]*__inward[1]);
                                                    }
                                                    if (__inLen <= 1e-6) {
                                                        __inward = [ -__u3028[1], __u3028[0] ];
                                                        __inLen = Math.sqrt(__inward[0]*__inward[0] + __inward[1]*__inward[1]) || 1;
                                                    }
                                                    __inward[0] /= __inLen;
                                                    __inward[1] /= __inLen;
                                                } else {
                                                    __inward = [ -__u3028[1], __u3028[0] ];
                                                    var __tmpLen = Math.sqrt(__inward[0]*__inward[0] + __inward[1]*__inward[1]) || 1;
                                                    __inward[0] /= __tmpLen;
                                                    __inward[1] /= __tmpLen;
                                                }
                                                var __offset3028 = cm(0.45);
                                                var __thirdLen3028 = __len3028 / 3;
                                                var __ctrl30 = [ __p30[0] + __u3028[0]*__thirdLen3028 + __inward[0]*__offset3028, __p30[1] + __u3028[1]*__thirdLen3028 + __inward[1]*__offset3028 ];
                                                var __ctrl28 = [ __p28[0] - __u3028[0]*__thirdLen3028 + __inward[0]*__offset3028, __p28[1] - __u3028[1]*__thirdLen3028 + __inward[1]*__offset3028 ];
                                                var __curve3028 = LAYERS['Back Construction'].lines.pathItems.add();
                                                __curve3028.setEntirePath([ toArt(__p30), toArt(__p28) ]);
                                                __curve3028.stroked = true;
                                                __curve3028.filled = false;
                                                __curve3028.strokeWidth = 1;
                                                try { __curve3028.name = 'Back Side Curve 30-28'; } catch (eNm3028) {}
                                                try { __curve3028.strokeColor = layerColor('Back Construction'); } catch (eClr3028) {}
                                                try {
                                                    var __c30 = __curve3028.pathPoints[0];
                                                    var __c28 = __curve3028.pathPoints[1];
                                                    __c30.leftDirection = toArt(__p30);
                                                    __c30.rightDirection = toArt(__ctrl30);
                                                    __c30.pointType = PointType.SMOOTH;
                                                    __c28.leftDirection = toArt(__ctrl28);
                                                    __c28.rightDirection = toArt(__p28);
                                                    __c28.pointType = PointType.SMOOTH;
                                                } catch (eHandles3028) {}
                                            }
                                        }
                                    } catch (eCurve3028) {}
                                    var __dx3028 = (__use.p28[0] - __p30[0]);
                                    var __dy3028 = (__use.p28[1] - __p30[1]);
                                    if (Math.abs(__dy3028) > 1e-6) {
                                        var __t32 = (__hipDrop - __p30[1]) / __dy3028; // parameter along 30->28 reaching waist y
                                        if (__t32 > 1) { // beyond 28 upwards
                                            var __p32 = [ __p30[0] + __dx3028 * __t32, __p30[1] + __dy3028 * __t32 ];
                                            drawDashedLineOn('Back Construction', __use.p28, __p32, 1, '28 to 32');
                                            drawMarkerOn('Back Construction', __p32, 32);
                                            __backState.p32 = __p32;
                                            __maybeCaptureInitialBack();
                                            __buildBackWaistAndDarts();
                                        }
                                    }
                                }
                            } catch (e302832) {}

                            // From 32, drop a perpendicular to the back line (Buttocks Angle); mark 33
                            try {
                                if (typeof __p32 !== 'undefined' && __p32 && typeof __p25 !== 'undefined' && __p25 && typeof __vx !== 'undefined' && typeof __vy !== 'undefined') {
                                    var __vBLen = Math.sqrt(__vx*__vx + __vy*__vy) || 1;
                                    var __uxBL = __vx / __vBLen, __uyBL = __vy / __vBLen;
                                    var __nxBL = -__uyBL, __nyBL = __uxBL;
                                    var __wX = __p32[0] - __p25[0];
                                    var __wY = __p32[1] - __p25[1];
                                    var __s = -(__wX*__nxBL + __wY*__nyBL);
                                    var __p33 = [ __p32[0] + __nxBL*__s, __p32[1] + __nyBL*__s ];
                                    drawLineOn('Back Construction', __p32, __p33, 1.2, '32 to 33');
                                    drawMarkerOn('Back Construction', __p33, 33);
                                    __backState.p33 = __p33;
                                    __maybeCaptureInitialBack();
                                    __buildBackWaistAndDarts();
                                }
                            } catch (e33) {}
                        }
                    } catch (e3031) {}

                    drawMarkerOn('Front Construction', __p14, 14);
                } catch (e12) {}

                // Label the Hip Line (with measurement) above the line: from sWaH edge, 5cm right, 0.2cm up
                try {
                    var __lenStr = (Math.round(__fTrW * 100) / 100).toFixed(2);
                    var __hLbl = toArt([ cm(10), cm(__y7 - 0.7) ]);
                    var __tfH = LABELS_DIM_GROUP.textFrames.add();
                    __tfH.contents = 'Hip Line ' + __lenStr + 'cm';
                    try { __tfH.name = 'Hip Line label'; } catch (eNmHL) {}
                    __tfH.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
                    __tfH.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                    __tfH.left = __hLbl[0];
                    __tfH.top  = __hLbl[1];
                } catch (eLblHip) {}

                // Square up (vertical) from 8 to the waistline (front waist line at y = __hipDrop) with dashed line, mark 9
                try {
                    var __p9 = [cm(__fTrW), __hipDrop];
                    drawDashedLineOn('Basic Frame', __p8, __p9, 1, 'line 8 to 9');
                    drawMarkerOn('Basic Frame', __p9, 9);
                } catch (eUp) {}

                // From 9, mark 20 inwards based on Hip Profile (Flat: 0.5cm, Normal: 0.75cm, Curvy: 1cm)
                try {
                    var __hp = (hipProfile || 'Normal').toLowerCase();
                    var __inw = (__hp === 'curvy') ? 1 : ((__hp === 'flat') ? 0.5 : 0.75);
                    var __p20 = [ cm(Math.max(0, (__fTrW - __inw) - 0.5)), __hipDrop ];
                    drawMarkerOn('Front Construction', __p20, 20);
                    try {
                        var __frontInitialPts = [];
                        if (__point1) __frontInitialPts.push(__clonePoint(__point1));
                        if (__p20) __frontInitialPts.push(__clonePoint(__p20));
                        if (__frontInitialPts.length >= 2) {
                            __initialFrontWaistPoints = __frontInitialPts;
                            __frontWaistBaseCm = __pathLengthCm(__frontInitialPts);
                            __maybeSetInitialPlan();
                        } else {
                            __frontWaistBaseCm = null;
                        }
                        __updateMeasuredWaistTotals();
                    } catch (eFrontWaistBase) {}

                    // From 8, mark 8a 0.5cm to the right
                    var __p8a = [ cm(__fTrW), cm(__y7) ];
                    drawMarkerOn('Front Construction', __p8a, '8a');

                    // Connect 8a and 20 as Centre Front
                    drawLineOn('Front Construction', __p8a, __p20, 1, 'Centre Front');
                    // Label CF, placed inward (to the left) and parallel to the line
                    try {
                        var __dxCF = __p20[0] - __p8a[0];
                        var __dyCF = __p20[1] - __p8a[1];
                        var __angleDegCF = Math.atan2(__dyCF, __dxCF) * 180 / Math.PI;
                        var __pageAngleCF = -__angleDegCF;
                        var __midCF = [ (__p8a[0] + __p20[0]) / 2, (__p8a[1] + __p20[1]) / 2 ];
                        var __labelCFDraft = [ __midCF[0] - cm(0.2), __midCF[1] ]; // inward (left) by 0.2cm
                        var __labelCF = toArt(__labelCFDraft);
                        var __tfCF = LABELS_DIM_GROUP.textFrames.add();
                        __tfCF.contents = 'CF';
                        try { __tfCF.name = 'CF label'; } catch (eNmCF) {}
                        __tfCF.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
                        __tfCF.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                        __tfCF.left = __labelCF[0];
                        __tfCF.top  = __labelCF[1];
                        try { __tfCF.rotate(__pageAngleCF); } catch (eRotCF) {}
                    } catch (eLblCF) {}

                    // Connect 20 directly to 14 (no raise)
                    try {
                        if (typeof __p14 !== 'undefined' && __p14) {
                            drawLineOn('Front Construction', __p20, __p14, 1, '20 to 14');
                        }
                    } catch (e2014) {}

                    // CF auxiliary construction: extend 20-8a to crotch; letters a-e; connect D->17; midpoint F->C
                    try {
                        var __targetY = cm(__len);
                        var __denCF2 = (__p8a[1] - __p20[1]);
                        if (Math.abs(__denCF2) > 1e-6) {
                            var __tC2 = (__targetY - __p20[1]) / __denCF2;
                            var __pCrotchOnCF2 = [ __p20[0] + (__p8a[0] - __p20[0]) * __tC2, __targetY ];
                            // Dashed from 8a down to crotch intersection
                            drawDashedLineOn('Front Construction', __p8a, __pCrotchOnCF2, 1, 'CF 8a to Crotch');

                            // Place letters on the numbers group: a..e along 8a->crotch
                            function __placeLetter2(ptDraft, ch) {
                                try {
                                    var tfL2 = LAYERS['Front Construction'].numbers.textFrames.add();
                                    tfL2.contents = String(ch);
                                    tfL2.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
                                    tfL2.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                                    var pxy2 = toArt(ptDraft);
                                    tfL2.left = pxy2[0];
                                    tfL2.top  = pxy2[1];
                                } catch (eLet2) {}
                            }
                            var __aP2 = __p8a;
                            var __eP2 = __pCrotchOnCF2;
                            var __bP2 = [ __aP2[0] + (__eP2[0] - __aP2[0]) * 0.25, __aP2[1] + (__eP2[1] - __aP2[1]) * 0.25 ];
                            var __cP2 = [ __aP2[0] + (__eP2[0] - __aP2[0]) * 0.50, __aP2[1] + (__eP2[1] - __aP2[1]) * 0.50 ];
                            var __dP2 = [ __aP2[0] + (__eP2[0] - __aP2[0]) * 0.75, __aP2[1] + (__eP2[1] - __aP2[1]) * 0.75 ];
                            __placeLetter2(__aP2, 'a');
                            __placeLetter2(__bP2, 'b');
                            __placeLetter2(__cP2, 'c');
                            __placeLetter2(__dP2, 'd');
                            __placeLetter2(__eP2, 'e');

                            // Dashed D->17, then F (midpoint) -> C
                            if (typeof __pt17 !== 'undefined' && __pt17) {
                                drawDashedLineOn('Front Construction', __dP2, __pt17, 1, 'D to 17');
                                var __fP2 = [ (__dP2[0] + __pt17[0]) / 2, (__dP2[1] + __pt17[1]) / 2 ];
                                __placeLetter2(__fP2, 'f');
                                drawDashedLineOn('Front Construction', __fP2, __cP2, 1, 'F to C');

                                // Build 8b..8f and draw single cubic 8a->17 with specific handles
                                try {
                                    var __p8a = __aP2;
                                    var __p8b = __eP2; // crotch on CF
                                    // 8c/8d/8e along 8a->8b
                                    function __lerp2(pA, pB, t) { return [ pA[0] + (pB[0] - pA[0]) * t, pA[1] + (pB[1] - pA[1]) * t ]; }
                                    var __p8c = __lerp2(__p8a, __p8b, 0.25);
                                    var __p8d = __lerp2(__p8a, __p8b, 0.50);
                                    var __p8e = __lerp2(__p8a, __p8b, 0.75);
                                    var __p8f = __lerp2(__p8e, __pt17, 0.5);

                                    // Optional markers (letters only)
                                    // __placeLetter2(__p8b, '8b'); __placeLetter2(__p8c, '8c'); __placeLetter2(__p8d, '8d'); __placeLetter2(__p8e, '8e'); __placeLetter2(__p8f, '8f');

                                    // Build front crotch structure: join CF line and constrained crotch arc
                    try {
                        var __start20 = (typeof __p20u !== 'undefined' && __p20u) ? __p20u : __p20;

                        var __vecAE = [ __eP2[0] - __aP2[0], __eP2[1] - __aP2[1] ];
                        var __lenAE = Math.sqrt(__vecAE[0]*__vecAE[0] + __vecAE[1]*__vecAE[1]) || 1;
                        var __uAE = [ __vecAE[0] / __lenAE, __vecAE[1] / __lenAE ];

                        var __vec17F = [ __fP2[0] - __pt17[0], __fP2[1] - __pt17[1] ];
                        var __len17F = Math.sqrt(__vec17F[0]*__vec17F[0] + __vec17F[1]*__vec17F[1]) || 1;
                        var __u17F = [ __vec17F[0] / __len17F, __vec17F[1] / __len17F ];

                        var __baseLenA = Math.min(cm(6.8), __lenAE);
                        var __baseLen17 = Math.min(cm(1.31), __len17F);

                        function __projectCrotchT(pt) {
                            var __vx = __pt17[0] - __p8a[0];
                            var __vy = __pt17[1] - __p8a[1];
                            var __den = __vx*__vx + __vy*__vy;
                            if (__den < 1e-6) return 0.5;
                            var __dx = pt[0] - __p8a[0];
                            var __dy = pt[1] - __p8a[1];
                            var __t = (__dx*__vx + __dy*__vy) / __den;
                            if (__t < 0) __t = 0; else if (__t > 1) __t = 1;
                            return __t;
                        }

                        function __bezierPos(t, hA, h17) {
                            var __om = 1 - t;
                            var __A = __om*__om*__om;
                            var __B = 3*__om*__om*t;
                            var __C = 3*__om*t*t;
                            var __D = t*t*t;
                            return [
                                __A*__p8a[0] + __B*hA[0] + __C*h17[0] + __D*__pt17[0],
                                __A*__p8a[1] + __B*hA[1] + __C*h17[1] + __D*__pt17[1]
                            ];
                        }

                        var __midCFline = [ (__cP2[0] + __fP2[0]) / 2, (__cP2[1] + __fP2[1]) / 2 ];
                        var __midF17line = [ (__fP2[0] + __pt17[0]) / 2, (__fP2[1] + __pt17[1]) / 2 ];
                        var __targets = [
                            { pt: __midCFline, t: __projectCrotchT(__midCFline) },
                            { pt: __midF17line, t: __projectCrotchT(__midF17line) }
                        ];

                        var __scale = 1;
                        for (var __iter = 0; __iter < 6; __iter++) {
                            var __hATry = [ __p8a[0] + __uAE[0]*__baseLenA*__scale, __p8a[1] + __uAE[1]*__baseLenA*__scale ];
                            var __h17Try = [ __pt17[0] + __u17F[0]*__baseLen17*__scale, __pt17[1] + __u17F[1]*__baseLen17*__scale ];
                            var __fits = true;
                            for (var __tIdx = 0; __tIdx < __targets.length; __tIdx++) {
                                var __tg = __targets[__tIdx];
                                var __pos = __bezierPos(__tg.t, __hATry, __h17Try);
                                if (__pos[1] > __tg.pt[1] + cm(0.1)) { __fits = false; break; }
                            }
                            if (__fits) {
                                __baseLenA *= __scale;
                                __baseLen17 *= __scale;
                                break;
                            }
                            __scale *= 0.85;
                        }

                        var __handleA = [ __p8a[0] + __uAE[0]*__baseLenA, __p8a[1] + __uAE[1]*__baseLenA ];
                        var __handle17 = [ __pt17[0] + __u17F[0]*__baseLen17, __pt17[1] + __u17F[1]*__baseLen17 ];

                        var __P0 = toArt(__start20), __P1 = toArt(__p8a), __P2 = toArt(__pt17);
                        var __seam = LAYERS['Front Construction'].lines.pathItems.add();
                        __seam.setEntirePath([ __P0, __P1, __P2 ]);
                        __seam.stroked = true; __seam.filled = false; __seam.strokeWidth = 1; __seam.strokeColor = layerColor('Front Construction');
                        try { __seam.name = 'Front CF + Crotch Seam'; } catch (eNmSeam) {}
                        var __s0 = __seam.pathPoints[0], __s1 = __seam.pathPoints[1], __s2 = __seam.pathPoints[2];
                        __s0.leftDirection = __P0; __s0.rightDirection = __P0; __s0.pointType = PointType.CORNER;
                        __s1.leftDirection = __P1; __s1.rightDirection = toArt(__handleA); __s1.pointType = PointType.SMOOTH;
                        __s2.leftDirection = toArt(__handle17); __s2.rightDirection = __P2; __s2.pointType = PointType.SMOOTH;
                    } catch (eNewCrotch) {}

                                } catch (eCubic) {}
                            }
                        }
                    } catch (eCFaux) {}
                } catch (e20) {}
                
                // Mark 21 from 1 on the raised waistline (inwards from the side dart)
                try {
                    var __planFrontShare = (__dartPlan && typeof __dartPlan.frontSideShare === 'number' && !isNaN(__dartPlan.frontSideShare)) ? __dartPlan.frontSideShare : null;
                    var __frontSideShare = (typeof FrontSideDart === 'number' && !isNaN(FrontSideDart)) ? FrontSideDart : (__planFrontShare != null ? __planFrontShare : 0);
                    if (__frontSideShare < 0) __frontSideShare = 0;
                    var __point1 = [0, 0];
                    var __p21 = [ __point1[0] + cm(__frontSideShare), __point1[1] ];
                    // Per request, do not draw a line from 1 to 21; just mark 21
                    drawMarkerOn('Front Construction', __p21, 21);
                    // Label near 21: "Front Waist X.XXcm" (front waist without darts)
                    var __frontSeamPoints = [];
                    if (__p20) __frontSeamPoints.push(__clonePoint(__p20));
                    if (typeof __p14 !== 'undefined' && __p14) __frontSeamPoints.push(__clonePoint(__p14));
                    __frontSeamPoints.push(__clonePoint(__p21));
                    var __frontSeamMeasured = (__frontSeamPoints.length >= 2) ? __pathLengthCm(__frontSeamPoints) : 0;
                    if (__frontSeamPoints.length >= 2) {
                        __postFrontWaistPoints = __frontSeamPoints;
                        __frontWaistBaseCm = __frontSeamMeasured;
                        __maybeSetPostPlan();
                    }
                    try {
                        if ($.global.measurements) {
                            $.global.measurements.FrontWaistSeam = (__frontWaistBaseCm != null) ? __frontWaistBaseCm : ((__frontSeamPoints.length >= 2) ? __frontSeamMeasured : null);
                            $.global.measurements.FrontWaistRaw = Math.max(0, (WaC / 4) + (WaistEase / 4));
                            $.global.measurements.FrontSideDart = __frontSideShare;
                        }
                    } catch (eStoreFW) {}
                    var __labelSeam = (__frontWaistBaseCm != null) ? __frontWaistBaseCm : ((__frontSeamPoints.length >= 2) ? __frontSeamMeasured : 0);
                    var __spanStr = (Math.round(__labelSeam * 100) / 100).toFixed(2);
                    var __lblDraft = [ __p14[0] - cm(4), __p14[1] + cm(0.5) ];
                    var __lblPt = toArt(__lblDraft);
                    try {
                        var __tfW = LABELS_DIM_GROUP.textFrames.add();
                        __tfW.contents = 'Front Waist ' + __spanStr + 'cm';
                        try { __tfW.name = 'Front Waist label'; } catch (eNmW) {}
                        __tfW.textRange.characterAttributes.size = LABEL_FONT_SIZE_PT;
                        __tfW.textRange.characterAttributes.fillColor = makeRGB(0, 0, 0);
                        __tfW.left = __lblPt[0];
                        __tfW.top  = __lblPt[1];
                    } catch (eWLbl) {}

                    // Connect 21 and 14 with a short squared corner (if 14 exists)
                    try {
                        if (typeof __p14 !== 'undefined' && __p14) {
                            var __p21Drop = [ __p21[0], __p21[1] + cm(0.2) ];
                            drawLineOn('Front Construction', __p21, __p21Drop, 1, '21 vertical drop');
                            drawLineOn('Front Construction', __p21, __p14, 1, '21 to 14');
                        }
                    } catch (e2114) {}

                    // Build front side curve from hip (7) to waist (21)
                    try {
                        if (typeof __p7 !== 'undefined' && __p7) {
                            var __Q0 = toArt(__p7), __Q1 = toArt(__p21);
                            var __sideCurve = LAYERS['Front Construction'].lines.pathItems.add();
                            __sideCurve.setEntirePath([ __Q0, __Q1 ]);
                            __sideCurve.stroked = true;
                            __sideCurve.filled = false;
                            __sideCurve.strokeWidth = 1;
                            __sideCurve.strokeColor = layerColor('Front Construction');
                            try { __sideCurve.name = 'Front Side Curve 7-21'; } catch (eNmSide) {}

                            var __sx0 = __sideCurve.pathPoints[0], __sx1 = __sideCurve.pathPoints[1];

                            var __handle7 = [ __p7[0], __p7[1] - cm(11) ];
                            __sx0.leftDirection = toArt(__p7);
                            __sx0.rightDirection = toArt(__handle7);
                            __sx0.pointType = PointType.SMOOTH;

                            __sx1.leftDirection = __Q1;
                            __sx1.rightDirection = __Q1;
                            __sx1.pointType = PointType.CORNER;
                        }
                    } catch (eSideCurve) {}

                    // Midpoint H between 21 and 14 (letters: no circle)
                    try {
                        if (typeof __p14 !== 'undefined' && __p14) {
                            var __frontDartIntake = (__dartPlan && typeof __dartPlan.frontDart === 'number' && !isNaN(__dartPlan.frontDart)) ? __dartPlan.frontDart : ((typeof FrontDart === 'number' && !isNaN(FrontDart)) ? Math.max(0, FrontDart) : 0);
                            var __h = [ (__p21[0] + __p14[0]) / 2, (__p21[1] + __p14[1]) / 2 ];
                            placeLetterOn('Front Construction', __h, 'h');
                            // Square down to the Hip Line (y = cm(__y7)) with dashed
                            try {
                                if (typeof __y7 !== 'undefined') {
                                    var __hDown = [ __h[0], cm(__y7) ];
                                    drawDashedLineOn('Front Construction', __h, __hDown, 1, 'h to Hip Line');
                                }
                            } catch (eHdown) {}

                            if (__frontDartIntake > 0.05) {
                                // Mark i and j on left/right half of the front dart width around H, along the 21-14 waistline
                                var __halfFD = cm(__frontDartIntake / 2);
                                var __dxW = (__p14[0] - __p21[0]);
                                var __dyW = (__p14[1] - __p21[1]);
                                var __lenW = Math.sqrt(__dxW*__dxW + __dyW*__dyW) || 1;
                                var __uxW = __dxW / __lenW; // unit tangent along waistline
                                var __uyW = __dyW / __lenW;
                                var __i = [ __h[0] - __uxW * __halfFD, __h[1] - __uyW * __halfFD ];
                                var __j = [ __h[0] + __uxW * __halfFD, __h[1] + __uyW * __halfFD ];
                                placeLetterOn('Front Construction', __i, 'i');
                                placeLetterOn('Front Construction', __j, 'j');

                                // Mark k: down from h by FrontDartLen, then shift left 0.5cm
                                var __k = [ __h[0] - cm(0.5), __h[1] + cm(Math.max(0, FrontDartLen)) ];
                                placeLetterOn('Front Construction', __k, 'k');

                                // Connect i and j to k (front dart)
                                drawLineOn('Front Construction', __i, __k, 1, 'Front Dart Left');
                                drawLineOn('Front Construction', __j, __k, 1, 'Front Dart Right');
                            }
                        }
                    } catch (eHDart) {}
                } catch (e21) {}
                }
            }
        }
    } catch (eDraft) {
        // Non-fatal; allows script to continue even if drawing fails
    }

    __buildBackWaistAndDarts();

    try { app.executeMenuCommand('fitin'); } catch (eFitArtboard) {}

})();





