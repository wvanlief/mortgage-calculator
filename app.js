/**
 * French Mortgage Loan Simulator - Application Logic
 * Implements real-time financial calculations, SVG chart rendering,
 * comparison matrix, and amortization schedule.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let currentCapital = 397858;
    let currentRate = 3.41; // TAEG in %
    let currentDuration = 25; // in years
    let amortizationView = 'annual'; // 'annual' or 'monthly'
    let activeTab = 'donut-tab';

    // --- Buy vs Rent State Variables ---
    let currentRent = 1200;
    let currentApport = 40000;
    let currentSavingsRate = 3.0;
    let currentOwnerCharges = 200;
    let currentNotaryRate = 7.5; // Frais d'acquisition in %
    let currentAppreciation = 1.5;
    let currentRentInflation = 1.5;

    // Cache points for resize rendering
    let lastBuyVsRentPoints = [];
    let lastBreakevenMonth = -1;

    // --- DOM Elements ---
    // Inputs & Sliders
    const capitalInput = document.getElementById('capital-input');
    const capitalSlider = document.getElementById('capital-slider');
    const rateInput = document.getElementById('rate-input');
    const rateSlider = document.getElementById('rate-slider');
    const durationInput = document.getElementById('duration-input');
    const durationSlider = document.getElementById('duration-slider');

    // Dashboard Results
    const monthlyPaymentVal = document.getElementById('monthly-payment-val');
    const totalInterestVal = document.getElementById('total-interest-val');
    const costRatioVal = document.getElementById('cost-ratio-val');
    const totalPaidVal = document.getElementById('total-paid-val');
    const comparisonCapitalLabel = document.getElementById('comparison-capital-label');

    // Chart Legends
    const legendCapitalVal = document.getElementById('legend-capital-val');
    const legendInterestVal = document.getElementById('legend-interest-val');

    // SVG Containers
    const donutChartContainer = document.getElementById('donut-chart-svg-container');
    const lineChartContainer = document.getElementById('line-chart-svg-container');

    // Tables & Schedule
    const comparisonGridTable = document.getElementById('comparison-grid-table');
    const amortizationTbody = document.getElementById('amortization-tbody');

    // Interactive Buttons
    const themeToggle = document.getElementById('theme-toggle');
    const tabBtnDonut = document.getElementById('tab-btn-donut');
    const tabBtnLine = document.getElementById('tab-btn-line');
    const toggleAnnualBtn = document.getElementById('toggle-annual-btn');
    const toggleMonthlyBtn = document.getElementById('toggle-monthly-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const printBtn = document.getElementById('print-btn');

    // Buy vs Rent DOM Elements
    const rentInput = document.getElementById('rent-input');
    const rentSlider = document.getElementById('rent-slider');
    const apportInput = document.getElementById('apport-input');
    const apportSlider = document.getElementById('apport-slider');
    const savingsRateInput = document.getElementById('savings-rate-input');
    const savingsRateSlider = document.getElementById('savings-rate-slider');
    const ownerChargesInput = document.getElementById('owner-charges-input');
    const ownerChargesSlider = document.getElementById('owner-charges-slider');
    const appreciationInput = document.getElementById('appreciation-input');
    const rentInflationInput = document.getElementById('rent-inflation-input');
    const notaryInput = document.getElementById('notary-input');
    const notarySlider = document.getElementById('notary-slider');

    const buyRentBanner = document.getElementById('buy-rent-banner');
    const buyRentWinnerTitle = document.getElementById('buy-rent-winner-title');
    const buyRentWinnerDiff = document.getElementById('buy-rent-winner-diff');

    const buyerFinalWealth = document.getElementById('buyer-final-wealth');
    const buyerPropertyPart = document.getElementById('buyer-property-part');
    const buyerSavingsPart = document.getElementById('buyer-savings-part');

    const renterFinalWealth = document.getElementById('renter-final-wealth');
    const renterPortfolioPart = document.getElementById('renter-portfolio-part');
    const renterSpentPart = document.getElementById('renter-spent-part');

    const buyerMonthlyCostLabel = document.getElementById('buyer-monthly-cost-label');
    const renterMonthlyCostLabel = document.getElementById('renter-monthly-cost-label');
    const savingsDirectionLabel = document.getElementById('savings-direction-label');
    const monthlySavingsLabel = document.getElementById('monthly-savings-label');
    const notaryFeesTotalLabel = document.getElementById('notary-fees-total-label');

    const breakevenLabel = document.getElementById('breakeven-label');
    const buyRentChartContainer = document.getElementById('buy-rent-chart-svg-container');

    // --- Formatters ---
    const formatCurrency = (val, showDecimals = false) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0
        }).format(val);
    };

    const formatPercent = (val) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(val / 100);
    };

    // --- Financial Calculations ---
    /**
     * Calculates monthly payment (mensualité)
     */
    function calculateMonthlyPayment(capital, annualRatePercent, durationYears) {
        const monthlyRate = (annualRatePercent / 100) / 12;
        const totalMonths = durationYears * 12;
        
        if (monthlyRate === 0) {
            return capital / totalMonths;
        }
        
        return capital * monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths));
    }

    /**
     * Computes the full amortization schedule
     */
    function computeAmortizationSchedule(capital, annualRatePercent, durationYears) {
        const monthlyRate = (annualRatePercent / 100) / 12;
        const totalMonths = durationYears * 12;
        const monthlyPayment = calculateMonthlyPayment(capital, annualRatePercent, durationYears);
        
        let remainingBalance = capital;
        const schedule = [];
        
        for (let month = 1; month <= totalMonths; month++) {
            const interestPaid = remainingBalance * monthlyRate;
            let principalPaid = monthlyPayment - interestPaid;
            
            // Adjust the final month to handle rounding discrepancies
            if (month === totalMonths) {
                principalPaid = remainingBalance;
            }
            
            remainingBalance -= principalPaid;
            if (remainingBalance < 0) remainingBalance = 0;
            
            schedule.push({
                month,
                payment: interestPaid + principalPaid,
                interest: interestPaid,
                principal: principalPaid,
                remainingBalance: remainingBalance
            });
            
            if (month === totalMonths) break;
        }
        
        return schedule;
    }

    // --- Amortization Table Renderers ---
    function renderAmortizationTable() {
        const schedule = computeAmortizationSchedule(currentCapital, currentRate, currentDuration);
        amortizationTbody.innerHTML = '';
        
        let html = '';
        let totalPaidSum = 0;
        let totalInterestSum = 0;
        let totalPrincipalSum = 0;

        if (amortizationView === 'monthly') {
            schedule.forEach(row => {
                totalPaidSum += row.payment;
                totalInterestSum += row.interest;
                totalPrincipalSum += row.principal;
                
                html += `
                    <tr>
                        <td>Mois ${row.month}</td>
                        <td>${formatCurrency(row.payment, true)}</td>
                        <td>${formatCurrency(row.interest, true)}</td>
                        <td>${formatCurrency(row.principal, true)}</td>
                        <td>${formatCurrency(row.remainingBalance, true)}</td>
                    </tr>
                `;
            });
        } else {
            // Annual aggregation
            let yearlyPayment = 0;
            let yearlyInterest = 0;
            let yearlyPrincipal = 0;
            
            schedule.forEach((row, index) => {
                yearlyPayment += row.payment;
                yearlyInterest += row.interest;
                yearlyPrincipal += row.principal;
                
                totalPaidSum += row.payment;
                totalInterestSum += row.interest;
                totalPrincipalSum += row.principal;
                
                // If end of year or last month of loan
                if ((index + 1) % 12 === 0 || (index + 1) === schedule.length) {
                    const yearNumber = Math.ceil((index + 1) / 12);
                    html += `
                        <tr>
                            <td>Année ${yearNumber}</td>
                            <td>${formatCurrency(yearlyPayment, true)}</td>
                            <td>${formatCurrency(yearlyInterest, true)}</td>
                            <td>${formatCurrency(yearlyPrincipal, true)}</td>
                            <td>${formatCurrency(row.remainingBalance, true)}</td>
                        </tr>
                    `;
                    // Reset yearly accumulators
                    yearlyPayment = 0;
                    yearlyInterest = 0;
                    yearlyPrincipal = 0;
                }
            });
        }

        // Add Totals Footer Row
        html += `
            <tr>
                <td><strong>Total</strong></td>
                <td><strong>${formatCurrency(totalPaidSum, true)}</strong></td>
                <td><strong>${formatCurrency(totalInterestSum, true)}</strong></td>
                <td><strong>${formatCurrency(totalPrincipalSum, true)}</strong></td>
                <td><strong>0,00 €</strong></td>
            </tr>
        `;

        amortizationTbody.innerHTML = html;
    }

    // --- Comparison Grid Matrix ---
    function renderComparisonGrid() {
        comparisonCapitalLabel.textContent = new Intl.NumberFormat('fr-FR').format(currentCapital);
        
        // Define rate columns (5 steps above and below currentRate, step = 0.2%)
        const step = 0.2;
        const columns = [];
        for (let i = -5; i <= 5; i++) {
            const rate = currentRate + i * step;
            if (rate >= 0.05) {
                columns.push(parseFloat(rate.toFixed(2)));
            }
        }

        // Define duration rows (5 years above and below currentDuration, step = 1 year)
        const rows = [];
        for (let i = -5; i <= 5; i++) {
            const years = currentDuration + i;
            if (years >= 1) {
                rows.push(years);
            }
        }

        let tableHtml = '<thead><tr><th>Durée</th>';
        columns.forEach(rate => {
            tableHtml += `<th>${rate.toFixed(2)}%</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        // Find columns closest to the currentRate
        let minDiff = Infinity;
        let closestRateColIndex = -1;
        columns.forEach((rate, idx) => {
            const diff = Math.abs(rate - currentRate);
            if (diff < minDiff) {
                minDiff = diff;
                closestRateColIndex = idx;
            }
        });

        rows.forEach(years => {
            const isCurrentYear = (years === currentDuration);
            tableHtml += `<tr><td>${years} ans</td>`;
            
            columns.forEach((rate, rateIdx) => {
                const payment = calculateMonthlyPayment(currentCapital, rate, years);
                const isHighlight = isCurrentYear && (rateIdx === closestRateColIndex);
                const highlightClass = isHighlight ? 'class="highlight-cell"' : '';
                
                tableHtml += `<td ${highlightClass}>${Math.round(payment).toLocaleString('fr-FR')}</td>`;
            });
            
            tableHtml += '</tr>';
        });

        tableHtml += '</tbody>';
        comparisonGridTable.innerHTML = tableHtml;
    }

    // --- Chart Renderers ---
    
    /**
     * Renders a custom SVG donut chart for cost breakdown
     */
    function renderDonutChart(capital, interest) {
        const total = capital + interest;
        const capPct = (capital / total) * 100;
        const intPct = (interest / total) * 100;
        
        // Donut Chart SVG Parameters
        const size = 200;
        const strokeWidth = 26;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const center = size / 2;
        
        // Calculations for dash offsets
        // Capital is secondary accent, Interest is primary accent
        const capOffset = circumference; // starts at 0
        const capDashArray = `${(capPct / 100) * circumference} ${circumference}`;
        
        const intOffset = circumference - ((capPct / 100) * circumference);
        const intDashArray = `${(intPct / 100) * circumference} ${circumference}`;

        donutChartContainer.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${size} ${size}" class="donut-chart-svg">
                <!-- Background Circle -->
                <circle cx="${center}" cy="${center}" r="${radius}" fill="transparent" stroke="var(--border-color)" stroke-width="${strokeWidth}" />
                
                <!-- Capital Segment (Indigo) -->
                <circle cx="${center}" cy="${center}" r="${radius}" fill="transparent" 
                        stroke="var(--accent-secondary)" stroke-width="${strokeWidth}"
                        stroke-dasharray="${capDashArray}" stroke-dashoffset="${capOffset}" 
                        transform="rotate(-90 ${center} ${center})"
                        stroke-linecap="round"
                        class="donut-segment" />
                
                <!-- Interest Segment (Emerald) -->
                <circle cx="${center}" cy="${center}" r="${radius}" fill="transparent" 
                        stroke="var(--accent-primary)" stroke-width="${strokeWidth}"
                        stroke-dasharray="${intDashArray}" stroke-dashoffset="${intOffset}" 
                        transform="rotate(-90 ${center} ${center})"
                        stroke-linecap="round"
                        class="donut-segment" />
                        
                <!-- Center Text -->
                <g transform="translate(${center}, ${center})">
                    <text y="-5" class="donut-text-val">${Math.round(intPct)}%</text>
                    <text y="15" class="donut-text-label">D'INTÉRÊTS</text>
                </g>
            </svg>
        `;
    }

    /**
     * Renders a custom SVG area chart for remaining balance and interest paid
     */
    function renderLineChart() {
        const schedule = computeAmortizationSchedule(currentCapital, currentRate, currentDuration);
        const totalPaid = currentCapital + schedule.reduce((sum, row) => sum + row.interest, 0);

        // Chart SVG Dimensions
        const width = 600;
        const height = 280;
        const padding = { top: 20, right: 20, bottom: 40, left: 65 };
        
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Sampling data for drawing points (max ~40 points to avoid SVG clutter)
        const samplingRate = Math.max(1, Math.floor(schedule.length / 30));
        const sampledPoints = [];
        
        let cumulativeInterest = 0;
        sampledPoints.push({
            x: 0,
            remainingBalance: currentCapital,
            cumInterest: 0
        });

        schedule.forEach((row, idx) => {
            cumulativeInterest += row.interest;
            if ((idx + 1) % samplingRate === 0 || (idx + 1) === schedule.length) {
                sampledPoints.push({
                    x: (idx + 1) / schedule.length,
                    remainingBalance: row.remainingBalance,
                    cumInterest: cumulativeInterest
                });
            }
        });

        // Translate data coordinate to SVG viewport pixels
        const getXPixel = (normalizedX) => padding.left + (normalizedX * chartWidth);
        const getYPixel = (value) => padding.top + chartHeight - ((value / totalPaid) * chartHeight);

        // Draw Axes & Gridlines
        let svgElements = `
            <defs>
                <linearGradient id="capital-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--accent-secondary)" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="var(--accent-secondary)" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="interest-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0"/>
                </linearGradient>
            </defs>
        `;

        // Horizontal Gridlines & Y-axis labels
        const gridLinesCount = 5;
        for (let i = 0; i <= gridLinesCount; i++) {
            const val = (totalPaid / gridLinesCount) * i;
            const y = getYPixel(val);
            svgElements += `
                <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="chart-grid-line" />
                <text x="${padding.left - 10}" y="${y + 4}" class="chart-axis-text" text-anchor="end">${Math.round(val/1000)}k €</text>
            `;
        }

        // X-axis labels (Years)
        const yearsCount = Math.min(6, currentDuration);
        const yearStep = Math.ceil(currentDuration / yearsCount);
        for (let year = 0; year <= currentDuration; year += yearStep) {
            const normX = year / currentDuration;
            const x = getXPixel(normX);
            svgElements += `
                <line x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}" class="chart-grid-line" />
                <text x="${x}" y="${height - padding.bottom + 20}" class="chart-axis-text" text-anchor="middle">${year} ans</text>
            `;
        }

        // Construct Paths for Areas and Lines
        let capPathD = `M ${getXPixel(0)} ${getYPixel(currentCapital)}`;
        let intPathD = `M ${getXPixel(0)} ${getYPixel(0)}`;
        
        sampledPoints.forEach(p => {
            const xPixel = getXPixel(p.x);
            capPathD += ` L ${xPixel} ${getYPixel(p.remainingBalance)}`;
            intPathD += ` L ${xPixel} ${getYPixel(p.cumInterest)}`;
        });

        // Close Area Paths for Shading
        const capAreaD = `${capPathD} L ${getXPixel(1)} ${getYPixel(0)} L ${getXPixel(0)} ${getYPixel(0)} Z`;
        const intAreaD = `${intPathD} L ${getXPixel(1)} ${getYPixel(0)} L ${getXPixel(0)} ${getYPixel(0)} Z`;

        svgElements += `
            <!-- Shaded Areas -->
            <path d="${capAreaD}" class="chart-area-capital" />
            <path d="${intAreaD}" class="chart-area-interest" />
            
            <!-- Lines -->
            <path d="${capPathD}" class="chart-line-capital" />
            <path d="${intPathD}" class="chart-line-interest" />
            
            <!-- Labels -->
            <text x="${getXPixel(0.1)}" y="${getYPixel(currentCapital * 0.75)}" fill="var(--accent-secondary)" font-size="10" font-weight="700">Capital Restant Dû</text>
            <text x="${getXPixel(0.55)}" y="${getYPixel(totalPaid * 0.25)}" fill="var(--accent-primary)" font-size="10" font-weight="700">Intérêts Cumulés</text>
        `;

        lineChartContainer.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
                ${svgElements}
            </svg>
        `;
    }

    // --- Main Calculations Updates ---
    function updateSimulatorResults() {
        // Calculate Monthly payment
        const monthlyPayment = calculateMonthlyPayment(currentCapital, currentRate, currentDuration);
        const totalMonths = currentDuration * 12;
        const totalPaid = monthlyPayment * totalMonths;
        const totalInterest = totalPaid - currentCapital;
        const costRatio = (totalInterest / currentCapital) * 100;

        // Update Dashboard Elements
        monthlyPaymentVal.textContent = formatCurrency(monthlyPayment);
        totalInterestVal.textContent = formatCurrency(totalInterest);
        costRatioVal.textContent = formatPercent(costRatio);
        totalPaidVal.textContent = formatCurrency(totalPaid);

        // Update Chart Legend Values
        legendCapitalVal.textContent = formatCurrency(currentCapital);
        legendInterestVal.textContent = formatCurrency(totalInterest);

        // Update Charts
        renderDonutChart(currentCapital, totalInterest);
        renderLineChart();

        // Update Tables
        renderComparisonGrid();
        renderAmortizationTable();

        // Update Buy vs Rent Comparative
        updateBuyVsRentResults();
    }

    // --- Buy vs Rent Calculations & UI Updates ---
    function updateBuyVsRentResults() {
        const monthlyPayment = calculateMonthlyPayment(currentCapital, currentRate, currentDuration);
        const totalMonths = currentDuration * 12;
        
        // Investment compounding rates
        const monthlySavingsRate = Math.pow(1 + currentSavingsRate / 100, 1 / 12) - 1;
        
        // Calculate notary fees (lost money for buyer at day 1)
        const notaryFees = (currentCapital + currentApport) * (currentNotaryRate / 100);
        
        // Renter starts with apport + saved notary fees in cash portfolio
        let renterPortfolio = currentApport + notaryFees; 
        let buyerPortfolio = 0; // Buyer puts their apport into the down payment, begins with 0 savings
        let totalRentPaid = 0;
        
        const schedule = computeAmortizationSchedule(currentCapital, currentRate, currentDuration);
        
        const points = [];
        points.push({
            month: 0,
            buyerWealth: currentApport, // Property (capital + apport) - loan (capital) = apport
            renterWealth: currentApport + notaryFees // Renter has apport + saved notary fees in cash
        });
        
        let currentRentAmount = currentRent;
        
        for (let m = 1; m <= totalMonths; m++) {
            // Rent inflation applied yearly
            if (m > 1 && (m - 1) % 12 === 0) {
                currentRentAmount = currentRentAmount * (1 + currentRentInflation / 100);
            }
            
            totalRentPaid += currentRentAmount;
            
            // Buyer monthly outflow
            const buyCost = monthlyPayment + currentOwnerCharges;
            
            // Difference in monthly budgets
            const diff = buyCost - currentRentAmount;
            
            if (diff > 0) {
                // Renting is cheaper: Renter saves the difference
                renterPortfolio = renterPortfolio * (1 + monthlySavingsRate) + diff;
                buyerPortfolio = buyerPortfolio * (1 + monthlySavingsRate);
            } else {
                // Buying is cheaper: Buyer saves the difference (diff is negative)
                buyerPortfolio = buyerPortfolio * (1 + monthlySavingsRate) - diff;
                renterPortfolio = renterPortfolio * (1 + monthlySavingsRate);
            }
            
            // Appreciated property value over time
            const propertyValue = (currentCapital + currentApport) * Math.pow(1 + currentAppreciation / 100, m / 12);
            
            // Remaining loan balance
            const remainingLoan = schedule[m - 1] ? schedule[m - 1].remainingBalance : 0;
            
            // Net wealth (actifs - passifs)
            const buyerWealth = propertyValue - remainingLoan + buyerPortfolio;
            const renterWealth = renterPortfolio;
            
            points.push({
                month: m,
                buyerWealth,
                renterWealth
            });
        }
        
        const finalBuyerWealth = points[totalMonths].buyerWealth;
        const finalRenterWealth = points[totalMonths].renterWealth;
        const finalPropertyValue = (currentCapital + currentApport) * Math.pow(1 + currentAppreciation / 100, currentDuration);
        
        // Cache variables for resize
        lastBuyVsRentPoints = points;
        
        // Update DOM Results
        buyerFinalWealth.textContent = formatCurrency(finalBuyerWealth);
        buyerPropertyPart.textContent = `Valeur bien : ${formatCurrency(finalPropertyValue)}`;
        buyerSavingsPart.textContent = `Portefeuille : ${formatCurrency(buyerPortfolio)}`;
        
        renterFinalWealth.textContent = formatCurrency(finalRenterWealth);
        renterPortfolioPart.textContent = `Portefeuille : ${formatCurrency(finalRenterWealth)}`;
        renterSpentPart.textContent = `Loyers payés : ${formatCurrency(totalRentPaid)}`;

        // Update Transparency Breakdown Panel
        const initialBuyCost = monthlyPayment + currentOwnerCharges;
        buyerMonthlyCostLabel.textContent = formatCurrency(initialBuyCost);
        renterMonthlyCostLabel.textContent = formatCurrency(currentRent);
        notaryFeesTotalLabel.textContent = formatCurrency(notaryFees);

        const initialSavings = initialBuyCost - currentRent;
        if (initialSavings > 0) {
            savingsDirectionLabel.textContent = "Épargne Mensuelle du Locataire :";
            monthlySavingsLabel.textContent = formatCurrency(initialSavings);
        } else {
            savingsDirectionLabel.textContent = "Épargne Mensuelle de l'Acheteur :";
            monthlySavingsLabel.textContent = formatCurrency(-initialSavings);
        }
        renterPortfolioPart.textContent = `Portefeuille : ${formatCurrency(finalRenterWealth)}`;
        renterSpentPart.textContent = `Loyers payés : ${formatCurrency(totalRentPaid)}`;
        
        // Highlight winner
        const diffWealth = Math.abs(finalBuyerWealth - finalRenterWealth);
        if (finalBuyerWealth >= finalRenterWealth) {
            buyRentBanner.className = "comparison-banner winner-buyer";
            buyRentWinnerTitle.textContent = "L'Achat est plus avantageux !";
            buyRentWinnerDiff.textContent = `+ ${formatCurrency(diffWealth)} de patrimoine net après ${currentDuration} ans`;
        } else {
            buyRentBanner.className = "comparison-banner winner-renter";
            buyRentWinnerTitle.textContent = "La Location est plus avantageuse !";
            buyRentWinnerDiff.textContent = `+ ${formatCurrency(diffWealth)} de patrimoine net après ${currentDuration} ans`;
        }
        
        // Breakeven Point calculation (crossing point)
        let breakevenMonth = -1;
        // Search first month after month 0 where buyer exceeds renter
        for (let m = 1; m <= totalMonths; m++) {
            if (points[m].buyerWealth > points[m].renterWealth && points[m-1].buyerWealth <= points[m-1].renterWealth) {
                breakevenMonth = m;
                break;
            }
        }
        
        lastBreakevenMonth = breakevenMonth;
        
        if (breakevenMonth !== -1) {
            const years = (breakevenMonth / 12).toFixed(1);
            breakevenLabel.textContent = `Seuil de rentabilité : ${years} ans`;
            breakevenLabel.style.display = "inline-block";
        } else {
            if (finalBuyerWealth > finalRenterWealth) {
                breakevenLabel.textContent = "Seuil de rentabilité : Immédiat";
            } else {
                breakevenLabel.textContent = "Seuil de rentabilité : Non atteint";
            }
        }
        
        renderBuyVsRentChart(points, breakevenMonth);
    }

    /**
     * Renders SVG Buy vs Rent wealth accumulation lines
     */
    function renderBuyVsRentChart(points, breakevenMonth) {
        const width = 600;
        const height = 220;
        const padding = { top: 15, right: 20, bottom: 35, left: 65 };
        
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        const totalMonths = points.length - 1;
        
        // Find max wealth for scaling Y
        const maxWealth = Math.max(...points.map(p => Math.max(p.buyerWealth, p.renterWealth)), 1000) * 1.05;
        
        const getXPixel = (normalizedX) => padding.left + (normalizedX * chartWidth);
        const getYPixel = (value) => padding.top + chartHeight - ((value / maxWealth) * chartHeight);
        
        let svgElements = `
            <defs>
                <linearGradient id="buyer-wealth-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.2"/>
                    <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="renter-wealth-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.2"/>
                    <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
                </linearGradient>
            </defs>
        `;
        
        // Y grid lines
        const gridTicks = 4;
        for (let i = 0; i <= gridTicks; i++) {
            const val = (maxWealth / gridTicks) * i;
            const y = getYPixel(val);
            svgElements += `
                <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="chart-grid-line" />
                <text x="${padding.left - 10}" y="${y + 4}" class="chart-axis-text" text-anchor="end">${Math.round(val/1000)}k €</text>
            `;
        }
        
        // X grid lines (Years)
        const yearsCount = Math.min(6, currentDuration);
        const yearStep = Math.ceil(currentDuration / yearsCount);
        for (let year = 0; year <= currentDuration; year += yearStep) {
            const normX = year / currentDuration;
            const x = getXPixel(normX);
            svgElements += `
                <line x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}" class="chart-grid-line" />
                <text x="${x}" y="${height - padding.bottom + 18}" class="chart-axis-text" text-anchor="middle">${year} ans</text>
            `;
        }
        
        // Draw Curves
        // Sample points to draw clean lines
        const sampleRate = Math.max(1, Math.floor(points.length / 40));
        let buyerPathD = `M ${getXPixel(0)} ${getYPixel(points[0].buyerWealth)}`;
        let renterPathD = `M ${getXPixel(0)} ${getYPixel(points[0].renterWealth)}`;
        
        for (let m = sampleRate; m <= totalMonths; m += sampleRate) {
            buyerPathD += ` L ${getXPixel(m/totalMonths)} ${getYPixel(points[m].buyerWealth)}`;
            renterPathD += ` L ${getXPixel(m/totalMonths)} ${getYPixel(points[m].renterWealth)}`;
        }
        
        // Always draw the exact final point
        buyerPathD += ` L ${getXPixel(1)} ${getYPixel(points[totalMonths].buyerWealth)}`;
        renterPathD += ` L ${getXPixel(1)} ${getYPixel(points[totalMonths].renterWealth)}`;
        
        // Areas for fill
        const buyerAreaD = `${buyerPathD} L ${getXPixel(1)} ${getYPixel(0)} L ${getXPixel(0)} ${getYPixel(0)} Z`;
        const renterAreaD = `${renterPathD} L ${getXPixel(1)} ${getYPixel(0)} L ${getXPixel(0)} ${getYPixel(0)} Z`;
        
        svgElements += `
            <path d="${buyerAreaD}" class="chart-area-buyer" />
            <path d="${renterAreaD}" class="chart-area-renter" />
            
            <path d="${buyerPathD}" class="chart-line-buyer" />
            <path d="${renterPathD}" class="chart-line-renter" />
        `;
        
        // Draw intersection marker
        if (breakevenMonth !== -1 && breakevenMonth < points.length) {
            const bp = points[breakevenMonth];
            const x = getXPixel(breakevenMonth / totalMonths);
            const y = getYPixel(bp.buyerWealth);
            
            svgElements += `
                <line x1="${x}" y1="${y}" x2="${x}" y2="${height - padding.bottom}" stroke="var(--accent-secondary)" stroke-width="1.5" stroke-dasharray="3,3" />
                <circle cx="${x}" cy="${y}" class="chart-intersection-point" />
            `;
        }
        
        buyRentChartContainer.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
                ${svgElements}
            </svg>
        `;
    }

    function checkPresetHighlight(rate) {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            const val = parseFloat(btn.getAttribute('data-val'));
            if (Math.abs(val - rate) < 0.05) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // --- Bidirectional Input Sync Helpers ---
    function syncInputs(val, sliderEl, inputEl, multiplier = 1) {
        sliderEl.value = val;
        inputEl.value = val;
    }

    // --- Event Listeners Setup ---
    
    // Capital Input Events
    capitalSlider.addEventListener('input', (e) => {
        currentCapital = parseInt(e.target.value);
        capitalInput.value = currentCapital;
        updateSimulatorResults();
    });

    capitalInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        // Boundaries checks
        if (isNaN(val) || val < 10000) val = 10000;
        if (val > 2000000) val = 2000000;
        
        currentCapital = val;
        capitalInput.value = val;
        // Expand slider max if capital exceeds it
        if (val > capitalSlider.max) {
            capitalSlider.max = Math.ceil(val / 100000) * 100000;
        }
        capitalSlider.value = val;
        updateSimulatorResults();
    });

    // Interest Rate Input Events
    rateSlider.addEventListener('input', (e) => {
        currentRate = parseFloat(e.target.value);
        rateInput.value = currentRate.toFixed(2);
        updateSimulatorResults();
    });

    rateInput.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0.05) val = 0.05;
        if (val > 15) val = 15;
        
        currentRate = val;
        rateInput.value = val.toFixed(2);
        
        if (val > rateSlider.max) rateSlider.max = Math.ceil(val);
        rateSlider.value = val;
        updateSimulatorResults();
    });

    // Duration Input Events
    durationSlider.addEventListener('input', (e) => {
        currentDuration = parseInt(e.target.value);
        durationInput.value = currentDuration;
        updateSimulatorResults();
    });

    durationInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 50) val = 50;
        
        currentDuration = val;
        durationInput.value = val;
        
        if (val > durationSlider.max) durationSlider.max = Math.ceil(val);
        durationSlider.value = val;
        updateSimulatorResults();
    });

    // Tab Switching Logic
    tabBtnDonut.addEventListener('click', () => {
        tabBtnDonut.classList.add('active');
        tabBtnLine.classList.remove('active');
        document.getElementById('donut-tab').classList.add('active');
        document.getElementById('line-tab').classList.remove('active');
        activeTab = 'donut-tab';
        // Redraw to ensure correct sizing
        updateSimulatorResults();
    });

    tabBtnLine.addEventListener('click', () => {
        tabBtnLine.classList.add('active');
        tabBtnDonut.classList.remove('active');
        document.getElementById('line-tab').classList.add('active');
        document.getElementById('donut-tab').classList.remove('active');
        activeTab = 'line-tab';
        // Redraw to ensure correct sizing
        updateSimulatorResults();
    });

    // Amortization View Toggles
    toggleAnnualBtn.addEventListener('click', () => {
        toggleAnnualBtn.classList.add('active');
        toggleMonthlyBtn.classList.remove('active');
        amortizationView = 'annual';
        renderAmortizationTable();
    });

    toggleMonthlyBtn.addEventListener('click', () => {
        toggleMonthlyBtn.classList.add('active');
        toggleAnnualBtn.classList.remove('active');
        amortizationView = 'monthly';
        renderAmortizationTable();
    });

    // CSV Export Handler
    exportCsvBtn.addEventListener('click', () => {
        const schedule = computeAmortizationSchedule(currentCapital, currentRate, currentDuration);
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Include BOM for proper French accents encoding in Excel
        
        // Headers
        csvContent += "Periode;Mensualite;Interets;Capital Amorti;Capital Restant Du\r\n";
        
        let totalPaid = 0;
        let totalInterest = 0;
        let totalPrincipal = 0;

        if (amortizationView === 'monthly') {
            schedule.forEach(row => {
                totalPaid += row.payment;
                totalInterest += row.interest;
                totalPrincipal += row.principal;
                csvContent += `Mois ${row.month};${row.payment.toFixed(2)};${row.interest.toFixed(2)};${row.principal.toFixed(2)};${row.remainingBalance.toFixed(2)}\r\n`;
            });
        } else {
            let yearlyPayment = 0;
            let yearlyInterest = 0;
            let yearlyPrincipal = 0;
            
            schedule.forEach((row, index) => {
                yearlyPayment += row.payment;
                yearlyInterest += row.interest;
                yearlyPrincipal += row.principal;
                totalPaid += row.payment;
                totalInterest += row.interest;
                totalPrincipal += row.principal;
                
                if ((index + 1) % 12 === 0 || (index + 1) === schedule.length) {
                    const yearNumber = Math.ceil((index + 1) / 12);
                    csvContent += `Annee ${yearNumber};${yearlyPayment.toFixed(2)};${yearlyInterest.toFixed(2)};${yearlyPrincipal.toFixed(2)};${row.remainingBalance.toFixed(2)}\r\n`;
                    yearlyPayment = 0;
                    yearlyInterest = 0;
                    yearlyPrincipal = 0;
                }
            });
        }
        
        // Sums Footer Row
        csvContent += `Total;${totalPaid.toFixed(2)};${totalInterest.toFixed(2)};${totalPrincipal.toFixed(2)};0.00\r\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `tableau_amortissement_${currentCapital}eur_${currentDuration}ans_${currentRate}pct.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Print Handler
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // Theme Switcher Handler
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        // Re-render chart to pick up theme color changes
        renderLineChart();
        updateBuyVsRentResults();
    });

    // --- Buy vs Rent Event Listeners ---
    // Rent Events
    rentSlider.addEventListener('input', (e) => {
        currentRent = parseInt(e.target.value);
        rentInput.value = currentRent;
        updateBuyVsRentResults();
    });

    rentInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 100) val = 100;
        if (val > 10000) val = 10000;
        currentRent = val;
        rentInput.value = val;
        if (val > rentSlider.max) rentSlider.max = val;
        rentSlider.value = val;
        updateBuyVsRentResults();
    });

    // Apport Events
    apportSlider.addEventListener('input', (e) => {
        currentApport = parseInt(e.target.value);
        apportInput.value = currentApport;
        updateBuyVsRentResults();
    });

    apportInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 1000000) val = 1000000;
        currentApport = val;
        apportInput.value = val;
        if (val > apportSlider.max) apportSlider.max = Math.ceil(val/10000)*10000;
        apportSlider.value = val;
        updateBuyVsRentResults();
    });

    // Notary Events
    notarySlider.addEventListener('input', (e) => {
        currentNotaryRate = parseFloat(e.target.value);
        notaryInput.value = currentNotaryRate.toFixed(1);
        updateBuyVsRentResults();
    });

    notaryInput.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 20) val = 20;
        currentNotaryRate = val;
        notaryInput.value = val.toFixed(1);
        if (val > notarySlider.max) notarySlider.max = Math.ceil(val);
        notarySlider.value = val;
        updateBuyVsRentResults();
    });

    // Savings Rate Events
    savingsRateSlider.addEventListener('input', (e) => {
        currentSavingsRate = parseFloat(e.target.value);
        savingsRateInput.value = currentSavingsRate.toFixed(1);
        checkPresetHighlight(currentSavingsRate);
        updateBuyVsRentResults();
    });

    savingsRateInput.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 25) val = 25;
        currentSavingsRate = val;
        savingsRateInput.value = val.toFixed(1);
        if (val > savingsRateSlider.max) savingsRateSlider.max = Math.ceil(val);
        savingsRateSlider.value = val;
        checkPresetHighlight(val);
        updateBuyVsRentResults();
    });

    // Owner Charges Events
    ownerChargesSlider.addEventListener('input', (e) => {
        currentOwnerCharges = parseInt(e.target.value);
        ownerChargesInput.value = currentOwnerCharges;
        updateBuyVsRentResults();
    });

    ownerChargesInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 5000) val = 5000;
        currentOwnerCharges = val;
        ownerChargesInput.value = val;
        if (val > ownerChargesSlider.max) ownerChargesSlider.max = val;
        ownerChargesSlider.value = val;
        updateBuyVsRentResults();
    });

    // Appreciation Events
    appreciationInput.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val)) val = 1.5;
        currentAppreciation = val;
        appreciationInput.value = val.toFixed(1);
        updateBuyVsRentResults();
    });

    // Rent Inflation Events
    rentInflationInput.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val)) val = 1.5;
        currentRentInflation = val;
        rentInflationInput.value = val.toFixed(1);
        updateBuyVsRentResults();
    });

    // Presets Click Handler
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const val = parseFloat(btn.getAttribute('data-val'));
            currentSavingsRate = val;
            savingsRateInput.value = val.toFixed(1);
            savingsRateSlider.value = val;
            updateBuyVsRentResults();
        });
    });

    // --- Initialization ---
    // Make sure values match UI inputs initially
    capitalInput.value = currentCapital;
    capitalSlider.value = currentCapital;
    rateInput.value = currentRate.toFixed(2);
    rateSlider.value = currentRate;
    durationInput.value = currentDuration;
    durationSlider.value = currentDuration;

    rentInput.value = currentRent;
    rentSlider.value = currentRent;
    apportInput.value = currentApport;
    apportSlider.value = currentApport;
    savingsRateInput.value = currentSavingsRate.toFixed(1);
    savingsRateSlider.value = currentSavingsRate;
    ownerChargesInput.value = currentOwnerCharges;
    ownerChargesSlider.value = currentOwnerCharges;
    notaryInput.value = currentNotaryRate.toFixed(1);
    notarySlider.value = currentNotaryRate;
    appreciationInput.value = currentAppreciation.toFixed(1);
    rentInflationInput.value = currentRentInflation.toFixed(1);
    
    // Set theme based on system preference (default is dark in CSS, check if light preferred)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    updateSimulatorResults();
    
    // Redraw SVG charts on window resize to ensure responsive scaling fits perfectly
    window.addEventListener('resize', () => {
        renderLineChart();
        if (lastBuyVsRentPoints.length > 0) {
            renderBuyVsRentChart(lastBuyVsRentPoints, lastBreakevenMonth);
        }
    });
});
