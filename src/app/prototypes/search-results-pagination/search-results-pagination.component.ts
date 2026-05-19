import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DS_COMPONENTS } from '../../shared/ds';
import { FvdrIconName } from '../../shared/ds/icons/icons';
import { TrackerService } from '../../services/tracker.service';

type FileType = 'folder' | 'pdf' | 'doc' | 'img' | 'xls' | 'txt';

interface SearchRow {
  id: number;
  type: FileType;
  index: string;
  name: string;
  snippet?: string;
  location: string;
  notes: number;
  labels: number;
  selected: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: FvdrIconName;
  iconActive: FvdrIconName;
  active?: boolean;
  open?: boolean;
  children?: { id: string; label: string; active?: boolean }[];
}

function makeRows(): SearchRow[] {
  const base: SearchRow[] = [
    { id: 1,  type: 'folder', index: '1',                     name: 'Competitors',                             location: '1 Finance',       notes: 1, labels: 3, selected: false },
    { id: 2,  type: 'folder', index: '3.1',                   name: 'Intellectual competitors',                location: '3 FY 2023',       notes: 4, labels: 0, selected: false },
    { id: 3,  type: 'folder', index: '6.3',                   name: 'Trade secrets competitors',               location: '6 Finance',       notes: 2, labels: 0, selected: false },
    { id: 4,  type: 'folder', index: '9.1',                   name: 'ACME Inc. competitors',                   location: '9 FY 2020',       notes: 2, labels: 0, selected: false },
    { id: 5,  type: 'folder', index: '10.2',                  name: 'ACME Cooperative compet',                 location: '10 Accounting',   notes: 0, labels: 0, selected: false },
    { id: 6,  type: 'pdf',    index: '12.1.2.2.5.6.7.8.1.2.3', name: 'Tax report',                            snippet: 'In-depth financial analysis of our top competitors, including key ratios and investment strategies.',           location: '2 Project Alpha',   notes: 2, labels: 0, selected: false },
    { id: 7,  type: 'doc',    index: '12.2.1',                name: 'Q3 Tax report',                           snippet: 'Detailed marketing strategies of our main competitors, focusing on their target audience and market share.',    location: '2 Project Alpha',   notes: 2, labels: 0, selected: false },
    { id: 8,  type: 'doc',    index: '12.2.2',                name: 'Y2022 Tax report',                        snippet: 'Effective sales tactics employed by our competitors, with a focus on closing techniques and retention.',        location: '2 Project Alpha',   notes: 2, labels: 0, selected: false },
    { id: 9,  type: 'pdf',    index: '12.2.3',                name: 'Q2 Tax report',                           snippet: 'Innovative product development plans of our competitors, including their research and development roadmap.',    location: '3 Project Beta',    notes: 0, labels: 0, selected: false },
    { id: 10, type: 'img',    index: '12.2.4',                name: 'Detailed Y2021 Tax report',               snippet: 'Successful customer acquisition strategies of our competitors, with a focus on lead generation tactics.',      location: '4 Project Gamma',   notes: 0, labels: 0, selected: false },
    { id: 11, type: 'pdf',    index: '12.2.5',                name: 'Accurate Q1 Tax report, outlining all income', snippet: 'Competitive pricing models used by our competitors, including their pricing strategies and margins.',   location: '5 Project Delta',   notes: 0, labels: 0, selected: false },
    { id: 12, type: 'doc',    index: '12.2.6',                name: 'Final Y2020 Tax report',                  snippet: 'Efficient supply chain management of our competitors, focusing on logistics and inventory control.',          location: '6 Project Epsilon', notes: 0, labels: 0, selected: false },
    { id: 13, type: 'pdf',    index: '12.2.7',                name: 'Final Q4 Tax report',                     snippet: 'Groundbreaking innovation and R&D efforts of our competitors, including their patent portfolio.',             location: '7 Project Zeta',    notes: 0, labels: 0, selected: false },
    { id: 14, type: 'pdf',    index: '12.2.8',                name: 'Tax report',                              snippet: 'Analysis of the global market presence of our competitors across key territories and sectors.',              location: '8 Project Eta',     notes: 0, labels: 0, selected: false },
    { id: 15, type: 'txt',    index: '12.2.9',                name: 'Annual competitors summary',              snippet: 'Annual review of top competitors performance metrics and strategic positioning.',                            location: '1 Finance',         notes: 1, labels: 0, selected: false },
    { id: 16, type: 'xls',    index: '13.1.1',                name: 'Competitors analysis matrix',             snippet: 'Comprehensive matrix comparing competitors across price, quality, and market reach dimensions.',             location: '2 Project Alpha',   notes: 0, labels: 2, selected: false },
    { id: 17, type: 'doc',    index: '13.1.2',                name: 'Competitive landscape report',            snippet: 'Detailed report on the competitive landscape, highlighting key competitors and their strategies.',           location: '3 FY 2023',         notes: 3, labels: 0, selected: false },
    { id: 18, type: 'pdf',    index: '13.2.1',                name: 'Market competitors overview',             snippet: 'Overview of market competitors with emphasis on emerging players and disruptive technologies.',              location: '6 Finance',         notes: 0, labels: 1, selected: false },
    { id: 19, type: 'img',    index: '13.2.2',                name: 'Competitors infographic FY2022',          snippet: 'Visual representation of competitors market share and growth trajectory over the past three years.',         location: '9 FY 2020',         notes: 0, labels: 0, selected: false },
    { id: 20, type: 'doc',    index: '13.3.1',                name: 'Strategic response to competitors',       snippet: 'Strategic framework for responding to competitor moves in key market segments.',                            location: '10 Accounting',     notes: 1, labels: 0, selected: false },
    { id: 21, type: 'pdf',    index: '14.1',                  name: 'Benchmark report — competitors',          snippet: 'Benchmark analysis comparing our performance against top five competitors on key KPIs.',                    location: '1 Finance',         notes: 2, labels: 0, selected: false },
    { id: 22, type: 'doc',    index: '14.2',                  name: 'SWOT: top competitors',                   snippet: 'SWOT analysis for the three leading competitors in our primary market segment.',                            location: '2 Project Alpha',   notes: 0, labels: 0, selected: false },
    { id: 23, type: 'xls',    index: '14.3',                  name: 'Competitors pricing tracker',             snippet: 'Real-time pricing tracker for competitors across all product lines and geographies.',                       location: '3 Project Beta',    notes: 0, labels: 3, selected: false },
    { id: 24, type: 'pdf',    index: '14.4',                  name: 'Q1 competitors review',                   snippet: 'Quarterly review of competitors product launches, campaigns, and strategic initiatives.',                   location: '4 Project Gamma',   notes: 1, labels: 0, selected: false },
    { id: 25, type: 'doc',    index: '14.5',                  name: 'Competitors customer survey analysis',    snippet: 'Analysis of customer surveys comparing our product to those of main competitors.',                          location: '5 Project Delta',   notes: 0, labels: 0, selected: false },
    { id: 26, type: 'pdf',    index: '15.1.1',                name: 'Risk assessment: competitors',            snippet: 'Risk assessment focusing on threats posed by top competitors in the current regulatory environment.',        location: '6 Finance',         notes: 2, labels: 0, selected: false },
    { id: 27, type: 'txt',    index: '15.1.2',                name: 'Competitors technology stack notes',      snippet: 'Internal notes on the technology choices made by competitors and their potential impact on us.',            location: '7 Project Zeta',    notes: 0, labels: 0, selected: false },
    { id: 28, type: 'doc',    index: '15.2',                  name: 'Competitors talent strategy',             snippet: 'Overview of how top competitors attract, retain, and develop talent in the engineering domain.',            location: '8 Project Eta',     notes: 1, labels: 0, selected: false },
    { id: 29, type: 'pdf',    index: '15.3',                  name: 'Investor relations: competitor analysis', snippet: 'Competitor analysis prepared for investor relations presentations and roadshow materials.',                 location: '9 FY 2020',         notes: 0, labels: 2, selected: false },
    { id: 30, type: 'img',    index: '15.4',                  name: 'Competitors brand positioning map',       snippet: 'Visual map of competitors brand positioning relative to our brand across key consumer dimensions.',         location: '10 Accounting',     notes: 0, labels: 0, selected: false },
    { id: 31, type: 'doc',    index: '16.1',                  name: 'Patent landscape: competitors',           snippet: 'Analysis of patent filings by competitors and areas of potential IP conflict.',                           location: '1 Finance',         notes: 0, labels: 0, selected: false },
    { id: 32, type: 'xls',    index: '16.2.1',                name: 'Competitors revenue model tracker',       snippet: 'Tracker comparing revenue models of competitors across subscription, licensing and services segments.',     location: '2 Project Alpha',   notes: 1, labels: 0, selected: false },
    { id: 33, type: 'pdf',    index: '16.2.2',                name: 'M&A activity among competitors',         snippet: 'Overview of merger and acquisition activity among competitors and strategic implications.',                 location: '3 FY 2023',         notes: 2, labels: 1, selected: false },
    { id: 34, type: 'doc',    index: '16.3',                  name: 'Competitors channel strategy',           snippet: 'Analysis of how competitors reach customers through direct and indirect distribution channels.',            location: '6 Finance',         notes: 0, labels: 0, selected: false },
    { id: 35, type: 'pdf',    index: '17.1',                  name: 'Annual report summary — competitors',    snippet: 'Summary of publicly available annual reports from top competitors with key financial highlights.',          location: '9 FY 2020',         notes: 1, labels: 0, selected: false },
    { id: 36, type: 'txt',    index: '17.2',                  name: 'Competitors product roadmap intel',       snippet: 'Intelligence gathered on the product roadmaps of key competitors based on public announcements.',          location: '10 Accounting',     notes: 0, labels: 0, selected: false },
    { id: 37, type: 'doc',    index: '17.3.1',                name: 'Digital marketing by competitors',        snippet: 'Detailed analysis of digital marketing campaigns run by competitors in the past 12 months.',               location: '2 Project Alpha',   notes: 0, labels: 2, selected: false },
    { id: 38, type: 'pdf',    index: '17.3.2',                name: 'SEO performance vs competitors',          snippet: 'Comparison of our SEO performance against competitors across target keywords and domains.',                location: '3 Project Beta',    notes: 1, labels: 0, selected: false },
    { id: 39, type: 'xls',    index: '17.4',                  name: 'Competitors ad spend tracker',            snippet: 'Estimated ad spend data for top five competitors segmented by channel and quarter.',                      location: '4 Project Gamma',   notes: 0, labels: 0, selected: false },
    { id: 40, type: 'img',    index: '17.5',                  name: 'Competitors social media benchmarks',     snippet: 'Benchmark report on social media engagement rates of competitors versus our accounts.',                    location: '5 Project Delta',   notes: 0, labels: 1, selected: false },
    { id: 41, type: 'doc',    index: '18.1',                  name: 'Competitive win/loss analysis',           snippet: 'Structured win/loss analysis based on sales team feedback about encounters with competitors.',             location: '6 Finance',         notes: 3, labels: 0, selected: false },
    { id: 42, type: 'pdf',    index: '18.2.1',                name: 'Product gaps vs competitors',             snippet: 'Internal analysis of feature and capability gaps relative to top competitors in the enterprise segment.',  location: '7 Project Zeta',    notes: 0, labels: 0, selected: false },
    { id: 43, type: 'doc',    index: '18.2.2',                name: 'UX comparison with competitors',          snippet: 'Usability study comparing our UX with three leading competitors across key user journeys.',               location: '8 Project Eta',     notes: 1, labels: 2, selected: false },
    { id: 44, type: 'pdf',    index: '18.3',                  name: 'Pricing response to competitors',         snippet: 'Strategic pricing response plan addressing competitive pricing pressure from new market entrants.',        location: '9 FY 2020',         notes: 0, labels: 0, selected: false },
    { id: 45, type: 'xls',    index: '19.1',                  name: 'Competitors headcount tracker',           snippet: 'Tracker of competitor headcount changes as signals of growth or strategic shifts.',                       location: '10 Accounting',     notes: 0, labels: 0, selected: false },
    { id: 46, type: 'doc',    index: '19.2',                  name: 'Competitors regulatory exposure',         snippet: 'Analysis of regulatory risks and compliance exposure facing key competitors.',                            location: '1 Finance',         notes: 2, labels: 0, selected: false },
    { id: 47, type: 'pdf',    index: '19.3.1',                name: 'Litigation history of competitors',       snippet: 'Overview of litigation history of competitors and ongoing legal proceedings of note.',                   location: '3 FY 2023',         notes: 0, labels: 1, selected: false },
    { id: 48, type: 'txt',    index: '19.3.2',                name: 'Competitors ESG disclosures',             snippet: 'Summary of ESG disclosures published by competitors and alignment with investor expectations.',          location: '6 Finance',         notes: 1, labels: 0, selected: false },
    { id: 49, type: 'doc',    index: '19.4',                  name: 'Board profiles of top competitors',       snippet: 'Profiles of board members at top competitors and their industry connections.',                           location: '2 Project Alpha',   notes: 0, labels: 0, selected: false },
    { id: 50, type: 'img',    index: '20.1',                  name: 'Global footprint of competitors',         snippet: 'Map visualization of global office and operations footprint of top five competitors.',                    location: '4 Project Gamma',   notes: 0, labels: 2, selected: false },
    { id: 51, type: 'pdf',    index: '20.2',                  name: 'Customer retention vs competitors',       snippet: 'Study of customer retention strategies used by competitors and their measured outcomes.',                 location: '5 Project Delta',   notes: 1, labels: 0, selected: false },
    { id: 52, type: 'xls',    index: '20.3.1',                name: 'Competitors gross margin model',          snippet: 'Estimated gross margin breakdown for competitors based on public filings and industry data.',             location: '6 Project Epsilon', notes: 0, labels: 0, selected: false },
    { id: 53, type: 'doc',    index: '20.3.2',                name: 'Competitors cloud infrastructure',        snippet: 'Assessment of cloud infrastructure investments made by competitors and associated capabilities.',         location: '7 Project Zeta',    notes: 2, labels: 0, selected: false },
    { id: 54, type: 'pdf',    index: '20.4',                  name: 'API strategy of competitors',             snippet: 'Comparison of API strategies and developer ecosystems cultivated by key competitors.',                   location: '8 Project Eta',     notes: 0, labels: 1, selected: false },
    { id: 55, type: 'txt',    index: '21.1',                  name: 'Competitors partnership programs',        snippet: 'Overview of partnership and reseller programs offered by competitors to expand market reach.',           location: '9 FY 2020',         notes: 0, labels: 0, selected: false },
    { id: 56, type: 'doc',    index: '21.2',                  name: 'Competitors support model comparison',    snippet: 'Comparison of customer support models across competitors including SLAs and satisfaction scores.',        location: '10 Accounting',     notes: 1, labels: 0, selected: false },
    { id: 57, type: 'pdf',    index: '21.3',                  name: 'Competitors analyst ratings',             snippet: 'Collection of analyst ratings and reviews for top competitors across major analyst firms.',               location: '1 Finance',         notes: 0, labels: 2, selected: false },
    { id: 58, type: 'xls',    index: '21.4.1',                name: 'Competitors NPS benchmarks',              snippet: 'Net Promoter Score benchmarks gathered for competitors through third-party research.',                   location: '3 FY 2023',         notes: 0, labels: 0, selected: false },
    { id: 59, type: 'img',    index: '21.4.2',                name: 'Competitors UI pattern library',          snippet: 'Visual collection of UI patterns and design trends observed across competitors products.',                location: '6 Finance',         notes: 2, labels: 0, selected: false },
    { id: 60, type: 'doc',    index: '22.1',                  name: 'Competitors hiring pages analysis',       snippet: 'Analysis of hiring pages and job descriptions at competitors as signals of strategic direction.',        location: '2 Project Alpha',   notes: 0, labels: 1, selected: false },
    { id: 61, type: 'pdf',    index: '22.2',                  name: 'Market entry by new competitors',         snippet: 'Assessment of new market entrants and potential competitors in the next 12–24 month horizon.',            location: '3 Project Beta',    notes: 1, labels: 0, selected: false },
    { id: 62, type: 'txt',    index: '22.3',                  name: 'Indirect competitors mapping',            snippet: 'Mapping of indirect competitors and substitute products that could disrupt our core market.',            location: '4 Project Gamma',   notes: 0, labels: 0, selected: false },
    { id: 63, type: 'doc',    index: '22.4',                  name: 'Competitors localization strategy',       snippet: 'How competitors adapt their products and messaging for local markets and cultural differences.',          location: '5 Project Delta',   notes: 0, labels: 2, selected: false },
    { id: 64, type: 'pdf',    index: '22.5.1',                name: 'Competitors event strategy',              snippet: 'Analysis of events and conferences competitors sponsor or attend to build brand and generate leads.',    location: '6 Finance',         notes: 1, labels: 0, selected: false },
    { id: 65, type: 'xls',    index: '22.5.2',                name: 'Competitors content output tracker',      snippet: 'Tracker monitoring volume and topics of content published by competitors across blogs and media.',       location: '7 Project Zeta',    notes: 0, labels: 0, selected: false },
    { id: 66, type: 'doc',    index: '23.1',                  name: 'Feedback from churned: competitors',      snippet: 'Feedback collected from churned customers who moved to competitors, with themes and quotes.',            location: '8 Project Eta',     notes: 2, labels: 1, selected: false },
    { id: 67, type: 'pdf',    index: '23.2',                  name: 'Competitive differentiation deck',        snippet: 'Sales enablement deck highlighting our competitive differentiation from top three competitors.',         location: '9 FY 2020',         notes: 0, labels: 0, selected: false },
    { id: 68, type: 'img',    index: '23.3',                  name: 'Competitors growth rate chart',           snippet: 'Visual chart of year-over-year growth rates for competitors compared to industry average.',              location: '10 Accounting',     notes: 1, labels: 0, selected: false },
    { id: 69, type: 'doc',    index: '23.4',                  name: 'Competitors geographic expansion plan',   snippet: 'Known or inferred geographic expansion plans of competitors based on public signals.',                   location: '2 Project Alpha',   notes: 0, labels: 0, selected: false },
    { id: 70, type: 'pdf',    index: '24.1',                  name: 'AI capabilities of competitors',          snippet: 'Assessment of AI and machine learning capabilities deployed by competitors in their products.',         location: '3 FY 2023',         notes: 0, labels: 2, selected: false },
    { id: 71, type: 'txt',    index: '24.2',                  name: 'Competitors security posture notes',      snippet: 'Notes on publicly known security incidents and certifications held by competitors.',                    location: '6 Finance',         notes: 0, labels: 0, selected: false },
    { id: 72, type: 'doc',    index: '24.3.1',                name: 'Competitors onboarding analysis',         snippet: 'Analysis of onboarding flows and time-to-value metrics reported by competitors.',                       location: '4 Project Gamma',   notes: 1, labels: 0, selected: false },
    { id: 73, type: 'xls',    index: '24.3.2',                name: 'Competitors upsell strategy tracker',     snippet: 'Tracker of upsell and cross-sell strategies deployed by competitors with effectiveness notes.',         location: '5 Project Delta',   notes: 0, labels: 0, selected: false },
    { id: 74, type: 'pdf',    index: '24.4',                  name: 'Contract terms analysis: competitors',    snippet: 'Comparison of standard contract terms offered by competitors including SLAs and penalties.',           location: '6 Project Epsilon', notes: 2, labels: 1, selected: false },
    { id: 75, type: 'doc',    index: '25.1',                  name: 'Competitors ecosystem strategy',          snippet: 'Analysis of partner ecosystem and marketplace strategies deployed by leading competitors.',             location: '1 Finance',         notes: 0, labels: 0, selected: false },
    { id: 76, type: 'pdf',    index: '25.2',                  name: 'Legacy vs modern competitors',            snippet: 'Comparison of legacy incumbents versus newer disruptive competitors in our primary market.',            location: '3 FY 2023',         notes: 1, labels: 0, selected: false },
    { id: 77, type: 'img',    index: '25.3',                  name: 'Competitors product screenshots library', snippet: 'Curated library of product screenshots from competitors for UX and benchmarking purposes.',            location: '7 Project Zeta',    notes: 0, labels: 2, selected: false },
    { id: 78, type: 'doc',    index: '25.4',                  name: 'Competitors CX investment signals',       snippet: 'Signals of customer experience investment by competitors including new hires and tooling.',             location: '8 Project Eta',     notes: 0, labels: 0, selected: false },
    { id: 79, type: 'xls',    index: '26.1',                  name: 'Competitors ARR estimates',               snippet: 'Annual Recurring Revenue estimates for private and public competitors based on available data.',        location: '9 FY 2020',         notes: 1, labels: 0, selected: false },
    { id: 80, type: 'pdf',    index: '26.2.1',                name: 'Competitors board game theory analysis',  snippet: 'Game theory analysis of strategic moves available to competitors in current market conditions.',        location: '10 Accounting',     notes: 0, labels: 1, selected: false },
    { id: 81, type: 'doc',    index: '26.2.2',                name: 'Competitor threat register',              snippet: 'Register of specific threats posed by each identified competitor with probability and impact scores.',  location: '2 Project Alpha',   notes: 2, labels: 0, selected: false },
    { id: 82, type: 'txt',    index: '26.3',                  name: 'Competitors free tier analysis',          snippet: 'Analysis of free tier and freemium offerings by competitors and their conversion strategies.',         location: '3 Project Beta',    notes: 0, labels: 0, selected: false },
    { id: 83, type: 'pdf',    index: '26.4',                  name: 'Competitors thought leadership audit',    snippet: 'Audit of thought leadership content produced by competitors across books, blogs and speaking.',         location: '4 Project Gamma',   notes: 1, labels: 0, selected: false },
    { id: 84, type: 'doc',    index: '27.1',                  name: 'Churn reasons linked to competitors',     snippet: 'Root cause analysis of customer churn cases where competitors were a primary factor.',                  location: '5 Project Delta',   notes: 0, labels: 2, selected: false },
    { id: 85, type: 'xls',    index: '27.2',                  name: 'Competitors feature velocity tracker',    snippet: 'Tracker measuring speed of feature releases by competitors to assess their product momentum.',          location: '6 Finance',         notes: 0, labels: 0, selected: false },
    { id: 86, type: 'pdf',    index: '27.3',                  name: 'Competitors customer case studies',       snippet: 'Collection of customer case studies published by competitors with notes on positioning claims.',        location: '7 Project Zeta',    notes: 1, labels: 0, selected: false },
    { id: 87, type: 'img',    index: '27.4',                  name: 'Competitors acquisition funnel map',      snippet: 'Mapped acquisition funnels of top three competitors based on observed digital behaviour.',             location: '8 Project Eta',     notes: 0, labels: 1, selected: false },
    { id: 88, type: 'doc',    index: '28.1',                  name: 'Competitive response playbook',           snippet: 'Internal playbook for responding to competitive moves including scripts and counter-messaging.',        location: '9 FY 2020',         notes: 2, labels: 0, selected: false },
    { id: 89, type: 'pdf',    index: '28.2',                  name: 'Competitors product launch history',      snippet: 'Timeline of major product launches by competitors over the past five years with market impact notes.',  location: '10 Accounting',     notes: 0, labels: 0, selected: false },
    { id: 90, type: 'txt',    index: '28.3',                  name: 'Competitors community strategy notes',    snippet: 'Notes on community building initiatives run by competitors and their engagement levels.',              location: '1 Finance',         notes: 0, labels: 0, selected: false },
    { id: 91, type: 'doc',    index: '28.4',                  name: 'Competitors technical documentation',     snippet: 'Review of technical documentation quality published by competitors aimed at developer audiences.',      location: '3 FY 2023',         notes: 1, labels: 2, selected: false },
    { id: 92, type: 'xls',    index: '29.1',                  name: 'Competitors language localisation data',  snippet: 'Data on number of languages and regional variants supported by competitors products.',                 location: '6 Finance',         notes: 0, labels: 0, selected: false },
    { id: 93, type: 'pdf',    index: '29.2',                  name: 'Competitors training offering',           snippet: 'Overview of training and certification programs offered by competitors to drive product adoption.',     location: '2 Project Alpha',   notes: 0, labels: 0, selected: false },
    { id: 94, type: 'doc',    index: '29.3',                  name: 'Competitors mobile strategy',             snippet: 'Assessment of mobile product strategy and app quality for key competitors in the market.',             location: '4 Project Gamma',   notes: 1, labels: 1, selected: false },
    { id: 95, type: 'img',    index: '29.4',                  name: 'Competitors final strategy overview',     snippet: 'Final consolidated overview of competitor strategies compiled from all available sources.',             location: '5 Project Delta',   notes: 0, labels: 0, selected: false },
  ];
  return base;
}

@Component({
  selector: 'fvdr-search-results-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="shell">

      <!-- ══ Sidebar ══ -->
      <nav class="sidebar" [class.sidebar--collapsed]="sidebarCollapsed">

        <!-- Account switcher -->
        <div class="account-switcher">
          <div class="account-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="4" fill="#084D4B"/>
              <g clip-path="url(#clip0)">
                <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10C14.477 10 10 14.477 10 20ZM28 20C28 24.418 24.418 28 20 28C19.661 28 19.328 27.979 19 27.938C22.947 27.446 26 24.08 26 20C26 15.92 22.946 12.554 18.999 12.062C19.327 12.021 19.661 12 20 12C24.418 12 28 15.582 28 20ZM12 20C12 18.343 13.343 17 15 17C16.657 17 18 18.343 18 20C18 21.657 16.657 23 15 23C13.343 23 12 21.657 12 20Z"
                  fill="#8CEAA7"/>
              </g>
              <defs><clipPath id="clip0"><rect width="20" height="20" fill="white" transform="translate(10 10)"/></clipPath></defs>
            </svg>
          </div>
          <ng-container *ngIf="!sidebarCollapsed">
            <span class="account-name">Project Alpha</span>
            <fvdr-icon name="chevron-down" class="account-chevron"></fvdr-icon>
          </ng-container>
        </div>

        <!-- Nav -->
        <div class="nav-list">
          <ng-container *ngFor="let item of navItems">
            <button class="nav-item"
              [class.nav-item--active]="item.active"
              [class.nav-item--open]="item.open"
              [title]="sidebarCollapsed ? item.label : ''"
              (click)="toggleNav(item)">
              <span class="nav-icon-zone">
                <fvdr-icon class="icon-default" [name]="item.icon"></fvdr-icon>
                <fvdr-icon class="icon-active"  [name]="item.iconActive"></fvdr-icon>
              </span>
              <span class="nav-label" *ngIf="!sidebarCollapsed">{{ item.label }}</span>
              <fvdr-icon *ngIf="!sidebarCollapsed && item.children"
                name="chevron-down" class="nav-chevron"
                [class.nav-chevron--up]="item.open"></fvdr-icon>
            </button>
            <div *ngIf="!sidebarCollapsed && item.open && item.children" class="nav-subitems">
              <button *ngFor="let c of item.children"
                class="nav-subitem" [class.nav-subitem--active]="c.active">
                {{ c.label }}
              </button>
            </div>
          </ng-container>
        </div>

        <!-- Bottom -->
        <div class="sidebar-bottom">
          <div class="sidebar-logo" *ngIf="!sidebarCollapsed">
            <svg width="80" height="16" viewBox="0 0 117 24" fill="none">
              <path d="M0.380615 3.02C0.380615 1.68 1.47081 0.65 2.84959 0.65C4.1963 0.65 5.25444 1.68 5.25444 3.02C5.25444 4.4 4.1963 5.4 2.84959 5.4C1.43875 5.4 0.380615 4.4 0.380615 3.02ZM0.861584 22.97V7.26H4.67727V22.97H0.861584Z" fill="#1F2129"/>
              <path d="M23.2427 1V22.999H19.5232V20.947C18.3689 22.326 16.7336 23.384 14.457 23.384C9.93588 23.384 6.56909 19.825 6.56909 15.143C6.56909 10.526 9.96794 6.935 14.4249 6.935C16.6694 6.935 18.2727 7.961 19.427 9.308V1H23.2427ZM19.6514 15.111C19.6514 12.514 17.8238 10.334 15.0021 10.334C12.2125 10.334 10.3848 12.514 10.3848 15.111C10.3848 17.773 12.2125 19.921 15.0021 19.921C17.7917 19.921 19.6514 17.773 19.6514 15.111Z" fill="#1F2129"/>
              <path d="M40.9744 16.458H28.886C29.367 18.478 30.8419 20.081 33.7278 20.081C35.5234 20.081 37.5755 19.408 38.9543 18.446L40.4613 21.139C38.9864 22.23 36.4533 23.32 33.5674 23.32C27.6034 23.32 24.9741 19.28 24.9741 15.111C24.9741 10.43 28.2768 6.903 33.2147 6.903C37.6717 6.903 41.0706 9.821 41.0706 14.79C41.1026 15.432 41.0385 15.945 40.9744 16.458ZM28.886 13.604H37.3511C37.0304 11.392 35.3951 10.045 33.2147 10.045C31.0343 10.045 29.399 11.424 28.886 13.604Z" fill="#1F2129"/>
              <path d="M59.1871 7.287V22.967H55.5638V21.043C54.3774 22.39 52.6779 23.352 50.4014 23.352C45.8161 23.352 42.5455 19.696 42.5455 15.047C42.5455 10.334 45.8803 6.903 50.4014 6.903C52.6779 6.903 54.3453 7.929 55.5638 9.275V7.287H59.1871ZM55.66 15.111C55.66 12.514 53.7681 10.334 50.9785 10.334C48.1889 10.334 46.3292 12.514 46.3292 15.111C46.3292 17.74 48.1889 19.921 50.9785 19.921C53.7361 19.921 55.66 17.74 55.66 15.111Z" fill="#1F2129"/>
              <path d="M61.5919 22.967V1H65.3755V22.999H61.5919V22.967Z" fill="#1F2129"/>
              <path d="M66.9468 20.274L69.0951 17.965C70.1853 19.376 71.8206 20.177 73.3597 20.177C74.7385 20.177 75.7004 19.44 75.7004 18.542C75.7004 17.869 75.2515 17.42 74.514 17.035C73.6162 16.586 71.5641 15.913 70.5701 15.4C68.7745 14.534 67.9087 13.123 67.9087 11.392C67.9087 8.698 70.1532 6.742 73.6803 6.742C75.7004 6.742 77.6884 7.448 79.1313 9.051L77.1433 11.456C76.0211 10.302 74.6743 9.82 73.5841 9.82C72.3657 9.82 71.6603 10.494 71.6603 11.296C71.6603 11.841 72.013 12.45 73.0391 12.835C74.0651 13.251 75.6042 13.764 76.8547 14.406C78.6183 15.336 79.5482 16.554 79.5482 18.414C79.5482 21.203 77.1433 23.384 73.3918 23.384C70.8587 23.384 68.4538 22.358 66.9468 20.274Z" fill="#1F2129"/>
              <path d="M80.51 21.171C80.51 19.921 81.5361 18.959 82.8187 18.959C84.0371 18.959 85.0311 19.921 85.0311 21.171C85.0311 22.486 84.0371 23.416 82.8187 23.416C81.5361 23.448 80.51 22.486 80.51 21.171Z" fill="#1F2129"/>
            </svg>
          </div>
          <button class="collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
            <fvdr-icon *ngIf="!sidebarCollapsed" name="angle-double-left"></fvdr-icon>
            <fvdr-icon *ngIf="sidebarCollapsed"  name="angle-double-right"></fvdr-icon>
          </button>
        </div>
      </nav>

      <!-- ══ Main ══ -->
      <div class="main-area">

        <!-- Header -->
        <header class="page-header">
          <nav class="breadcrumb">
            <span class="bc-link">Documents</span>
            <fvdr-icon name="chevron-right" class="bc-sep"></fvdr-icon>
            <span class="bc-current">Search results</span>
          </nav>
          <div class="header-actions">
            <button class="hdr-btn"><fvdr-icon name="theme-dark"></fvdr-icon></button>
            <button class="hdr-btn"><fvdr-icon name="help"></fvdr-icon></button>
            <button class="hdr-btn"><fvdr-icon name="bell"></fvdr-icon></button>
            <div class="avatar">TN</div>
          </div>
        </header>

        <!-- Content -->
        <div class="content">

          <!-- Search bar -->
          <div class="search-bar">
            <fvdr-icon name="search" class="search-ico"></fvdr-icon>
            <input class="search-input" [value]="searchTerm" readonly />
            <button class="hdr-btn" title="Clear"><fvdr-icon name="close"></fvdr-icon></button>
            <div class="search-divider"></div>
            <button class="hdr-btn" title="Advanced filters">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1"/>
                <rect x="9" y="1" width="6" height="6" rx="1"/>
                <rect x="1" y="9" width="6" height="6" rx="1"/>
                <rect x="9" y="9" width="6" height="6" rx="1"/>
              </svg>
            </button>
          </div>

          <!-- Toolbar -->
          <div class="toolbar">
            <div class="toolbar-left">
              <fvdr-btn label="Download" variant="secondary" size="m"></fvdr-btn>
              <fvdr-btn label="View as"  variant="secondary" size="m"></fvdr-btn>
              <button class="more-btn"><fvdr-icon name="more"></fvdr-icon></button>
            </div>
            <div class="toolbar-results">
              <ng-container *ngIf="!allSelected">
                <span class="results-count">{{ totalResults }} Results</span>
              </ng-container>
              <ng-container *ngIf="allSelected">
                <span class="results-count">Results: {{ totalResults }}</span>
                <span class="results-sep">|</span>
                <span class="selected-count">Selected: {{ selectedCount }}</span>
              </ng-container>
            </div>
          </div>

          <!-- Table -->
          <div class="tbl-scroll">
            <div class="tbl">

              <!-- Table header -->
              <div class="tbl-row tbl-row--head">
                <div class="col-check">
                  <label class="check-wrap">
                    <input type="checkbox" class="native-check"
                      [checked]="allSelected"
                      [indeterminate]="someSelected"
                      (change)="toggleAll($event)" />
                    <span class="check-box" [class.check-box--checked]="allSelected" [class.check-box--indeterminate]="someSelected && !allSelected">
                      <svg *ngIf="allSelected" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      <svg *ngIf="someSelected && !allSelected" width="10" height="2" viewBox="0 0 10 2" fill="none"><path d="M1 1H9" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>
                    </span>
                  </label>
                </div>
                <div class="col-index"><span class="th">Index</span></div>
                <div class="col-name"><span class="th">Name</span></div>
                <div class="col-loc"><span class="th">Location</span></div>
                <div class="col-notes"><span class="th">Notes</span></div>
                <div class="col-labels"><span class="th">Labels</span></div>
                <div class="col-act">
                  <button class="hdr-btn"><fvdr-icon name="settings"></fvdr-icon></button>
                </div>
              </div>

              <!-- Data rows -->
              <div *ngFor="let row of paginatedRows"
                class="tbl-row tbl-row--data"
                [class.tbl-row--selected]="row.selected">

                <!-- Checkbox -->
                <div class="col-check">
                  <label class="check-wrap">
                    <input type="checkbox" class="native-check"
                      [checked]="row.selected"
                      (change)="toggleRow(row, $event)" />
                    <span class="check-box" [class.check-box--checked]="row.selected">
                      <svg *ngIf="row.selected" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </span>
                  </label>
                </div>

                <!-- Index + icon -->
                <div class="col-index">
                  <span *ngIf="row.type === 'folder'" class="file-icon file-icon--folder">
                    <fvdr-icon name="folder"></fvdr-icon>
                  </span>
                  <span *ngIf="row.type !== 'folder'" class="file-icon" [ngClass]="'file-icon--' + row.type">
                    {{ row.type.toUpperCase() }}
                  </span>
                  <span class="td-index">{{ row.index }}</span>
                </div>

                <!-- Name + snippet -->
                <div class="col-name">
                  <div class="name-block">
                    <span class="td-name" [innerHTML]="highlight(row.name)"></span>
                    <span *ngIf="row.snippet" class="td-snippet" [innerHTML]="highlight(row.snippet)"></span>
                  </div>
                </div>

                <!-- Location -->
                <div class="col-loc">
                  <fvdr-icon name="folder" class="loc-folder-icon"></fvdr-icon>
                  <span class="td-loc">{{ row.location }}</span>
                </div>

                <!-- Notes -->
                <div class="col-notes">
                  <span *ngIf="row.notes > 0" class="notes-badge">{{ row.notes }}</span>
                </div>

                <!-- Labels -->
                <div class="col-labels">
                  <span *ngIf="row.labels > 0" class="labels-badge">{{ row.labels }}</span>
                </div>

                <!-- Actions -->
                <div class="col-act">
                  <button class="hdr-btn row-more"><fvdr-icon name="more"></fvdr-icon></button>
                </div>
              </div>

            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <button class="pg-btn pg-btn--nav"
              [disabled]="currentPage === 1"
              (click)="goTo(currentPage - 1)">
              <fvdr-icon name="chevron-left"></fvdr-icon>
            </button>

            <ng-container *ngFor="let p of pageNumbers">
              <button *ngIf="p !== -1"
                class="pg-btn"
                [class.pg-btn--active]="p === currentPage"
                (click)="goTo(p)">{{ p }}</button>
              <span *ngIf="p === -1" class="pg-ellipsis">…</span>
            </ng-container>

            <button class="pg-btn pg-btn--nav"
              [disabled]="currentPage === totalPages"
              (click)="goTo(currentPage + 1)">
              <fvdr-icon name="chevron-right"></fvdr-icon>
            </button>
          </div>

        </div><!-- /content -->
      </div><!-- /main-area -->
    </div><!-- /shell -->
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      height: 100vh;
      overflow: hidden;
    }

    /* ── Shell ── */
    .shell {
      display: flex;
      height: 100%;
      background: var(--color-stone-100);
    }

    /* ── Sidebar ── */
    .sidebar {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      width: 280px;
      background: var(--color-stone-200);
      border-right: 1px solid var(--color-divider);
      transition: width 0.22s ease;
      overflow: hidden;
    }
    .sidebar--collapsed { width: 72px; }

    .account-switcher {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      height: 64px;
      flex-shrink: 0;
      border-bottom: 1px solid var(--color-divider);
      cursor: pointer;
    }
    .account-logo { flex-shrink: 0; display: flex; align-items: center; }
    .account-name {
      flex: 1;
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .account-chevron { font-size: 14px; color: var(--color-text-secondary); flex-shrink: 0; }

    .nav-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: var(--space-4) 0;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .nav-item {
      display: flex;
      align-items: center;
      height: 40px;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      width: 100%;
      color: var(--color-text-secondary);
      text-align: left;
    }
    .nav-item:hover { color: var(--color-text-primary); background: var(--color-stone-300); }
    .nav-item--active { color: var(--color-text-primary); font-weight: 700; }
    .nav-item--active .icon-default { display: none; }
    .nav-item--active .icon-active  { display: flex; }

    .nav-icon-zone {
      width: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 20px;
      position: relative;
    }
    .icon-default, .icon-active { position: absolute; display: flex; }
    .icon-active { display: none; }

    .nav-label {
      flex: 1;
      font-size: var(--font-size-base);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-chevron {
      font-size: 14px;
      margin-right: var(--space-4);
      flex-shrink: 0;
      transition: transform 0.18s ease;
    }
    .nav-chevron--up { transform: rotate(180deg); }

    .nav-subitems { display: flex; flex-direction: column; }
    .nav-subitem {
      height: 36px;
      padding: 0 var(--space-4) 0 72px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
    }
    .nav-subitem:hover { background: var(--color-stone-300); color: var(--color-text-primary); }
    .nav-subitem--active { color: var(--color-text-primary); font-weight: 600; }

    .sidebar-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-4) var(--space-4) 20px;
      height: 64px;
      flex-shrink: 0;
      border-top: 1px solid var(--color-divider);
    }
    .sidebar-logo { display: flex; align-items: center; }
    .collapse-btn {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
      border: none; background: transparent; cursor: pointer;
      color: var(--color-text-secondary); border-radius: var(--radius-sm);
    }
    .collapse-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .sidebar--collapsed .sidebar-bottom { justify-content: center; padding: var(--space-4) 0; }

    /* ── Main ── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    /* ── Page header ── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 var(--space-6);
      background: var(--color-stone-0);
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .breadcrumb { display: flex; align-items: center; gap: var(--space-1); }
    .bc-link { color: var(--color-text-secondary); font-size: var(--font-size-base); cursor: pointer; }
    .bc-link:hover { color: var(--color-text-primary); }
    .bc-sep { font-size: 14px; color: var(--color-text-secondary); }
    .bc-current { font-size: var(--font-size-base); font-weight: 600; color: var(--color-text-primary); }
    .header-actions { display: flex; align-items: center; gap: var(--space-2); }
    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--color-primary-500); color: white;
      font-size: var(--text-caption1-size); font-weight: 600;
      display: flex; align-items: center; justify-content: center;
    }
    .hdr-btn {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
      border: none; background: transparent; cursor: pointer;
      color: var(--color-text-secondary); border-radius: var(--radius-sm);
      font-size: 16px; padding: 0; flex-shrink: 0;
    }
    .hdr-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    /* ── Content ── */
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: var(--space-6);
      gap: var(--space-4);
      overflow: hidden;
      background: var(--color-stone-0);
    }

    /* ── Search bar ── */
    .search-bar {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      height: 48px;
      border: 1.5px solid var(--color-divider);
      border-radius: var(--radius-md);
      padding: 0 var(--space-3);
      background: var(--color-stone-0);
      flex-shrink: 0;
    }
    .search-bar:focus-within { border-color: var(--color-primary-500); }
    .search-ico { font-size: 18px; color: var(--color-text-secondary); flex-shrink: 0; }
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-family: var(--font-family);
      font-size: 15px;
      color: var(--color-text-primary);
      background: transparent;
    }
    .search-divider {
      width: 1px; height: 20px;
      background: var(--color-divider);
      flex-shrink: 0; margin: 0 var(--space-1);
    }

    /* ── Toolbar ── */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      height: 40px;
    }
    .toolbar-left { display: flex; align-items: center; gap: var(--space-3); }
    .toolbar-results { display: flex; align-items: center; gap: var(--space-3); }
    .results-count  { font-size: var(--font-size-base); color: var(--color-text-secondary); }
    .results-sep    { color: var(--color-divider); }
    .selected-count { font-size: var(--font-size-base); color: var(--color-text-secondary); }
    .more-btn {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px;
      border: 1.5px solid var(--color-divider); border-radius: var(--radius-sm);
      background: transparent; cursor: pointer; color: var(--color-text-secondary);
      font-size: 16px;
    }
    .more-btn:hover { background: var(--color-hover-bg); }

    /* ── Table ── */
    .tbl-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: auto;
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
    }
    .tbl { display: flex; flex-direction: column; min-width: 900px; }

    .tbl-row {
      display: grid;
      grid-template-columns: 40px 160px 1fr 180px 72px 80px 48px;
      align-items: center;
      border-bottom: 1px solid var(--color-divider);
    }
    .tbl-row:last-child { border-bottom: none; }

    .tbl-row--head {
      background: var(--color-stone-200);
      position: sticky; top: 0; z-index: 2;
      min-height: 48px;
    }
    .tbl-row--data {
      min-height: 52px;
      cursor: pointer;
    }
    .tbl-row--data:hover  { background: var(--color-hover-bg); }
    .tbl-row--selected    { background: var(--color-primary-50) !important; }

    .tbl-row--head > div,
    .tbl-row--data > div {
      display: flex;
      align-items: center;
      padding: 0 var(--space-3);
    }
    .tbl-row--data > .col-name { padding: var(--space-2) var(--space-3); }

    .th {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    /* Checkbox */
    .col-check { justify-content: center; }
    .check-wrap { display: flex; align-items: center; cursor: pointer; }
    .native-check { position: absolute; opacity: 0; width: 0; height: 0; }
    .check-box {
      width: 16px; height: 16px;
      border: 1.5px solid var(--color-stone-500);
      border-radius: 3px;
      background: var(--color-stone-0);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: border-color 0.15s, background 0.15s;
    }
    .check-box--checked,
    .check-box--indeterminate {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
    }
    .check-wrap:hover .check-box { border-color: var(--color-primary-500); }

    /* File icon */
    .file-icon {
      width: 22px; height: 26px;
      border-radius: 2px;
      display: flex; align-items: center; justify-content: center;
      font-size: 7px; font-weight: 700; color: white;
      flex-shrink: 0; margin-right: var(--space-2);
    }
    .file-icon--folder {
      background: transparent;
      color: var(--color-primary-500);
      font-size: 20px;
      width: 22px; height: 22px;
    }
    .file-icon--pdf { background: #E54430; }
    .file-icon--doc { background: #358CEB; }
    .file-icon--img { background: #9B59B6; }
    .file-icon--xls { background: #2C9C74; }
    .file-icon--txt { background: #73757F; }

    .col-index { gap: 0; overflow: hidden; }
    .td-index {
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Name column */
    .col-name { overflow: hidden; }
    .name-block {
      display: flex; flex-direction: column; gap: 2px;
      min-width: 0; width: 100%;
    }
    .td-name {
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .td-snippet {
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }
    :host ::ng-deep mark {
      background: #FFDA07;
      color: inherit;
      padding: 0 1px;
      border-radius: 1px;
    }

    /* Location */
    .col-loc { gap: var(--space-2); overflow: hidden; }
    .loc-folder-icon { font-size: 14px; color: var(--color-text-secondary); flex-shrink: 0; }
    .td-loc {
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Notes */
    .col-notes { justify-content: center; }
    .notes-badge {
      min-width: 24px; height: 24px;
      background: var(--color-stone-300);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      padding: 0 var(--space-2);
    }

    /* Labels */
    .col-labels { justify-content: center; }
    .labels-badge {
      min-width: 24px; height: 24px;
      background: var(--color-stone-300);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      padding: 0 var(--space-2);
    }

    /* Actions col */
    .col-act { justify-content: center; }
    .row-more { opacity: 0; }
    .tbl-row--data:hover .row-more { opacity: 1; }

    /* ── Pagination ── */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      flex-shrink: 0;
      padding: var(--space-2) 0;
    }
    .pg-btn {
      display: flex; align-items: center; justify-content: center;
      min-width: 32px; height: 32px;
      padding: 0 var(--space-2);
      border: 1.5px solid var(--color-divider);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      cursor: pointer;
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      font-family: var(--font-family);
      transition: background 0.12s, border-color 0.12s;
    }
    .pg-btn:hover:not(:disabled) {
      background: var(--color-hover-bg);
      border-color: var(--color-stone-500);
    }
    .pg-btn--active {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
      color: white;
      font-weight: 600;
    }
    .pg-btn--active:hover { background: var(--color-primary-600); border-color: var(--color-primary-600); }
    .pg-btn--nav { color: var(--color-text-secondary); }
    .pg-btn:disabled { opacity: 0.35; cursor: default; }
    .pg-ellipsis {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
      user-select: none;
    }
  `],
})
export class SearchResultsPaginationComponent implements OnInit {
  private tracker = inject(TrackerService);
  private sanitizer = inject(DomSanitizer);

  sidebarCollapsed = false;
  searchTerm = 'Competitors';
  totalResults = 95;
  selectedCount = 105;
  currentPage = 1;
  readonly pageSize = 10;

  allRows: SearchRow[] = makeRows();

  navItems: NavItem[] = [
    { id: 'overview',     icon: 'nav-overview',      iconActive: 'nav-overview-active',     label: 'Dashboard',         active: false },
    { id: 'documents',    icon: 'nav-projects',       iconActive: 'nav-projects-active',     label: 'Documents',         active: true  },
    { id: 'participants', icon: 'nav-participants',   iconActive: 'nav-participants-active', label: 'Participants',      active: false },
    { id: 'permissions',  icon: 'lock-close',         iconActive: 'lock-open',               label: 'Permissions',       active: false },
    { id: 'qa',           icon: 'nav-api',            iconActive: 'nav-api-active',          label: 'Q&A',               active: false },
    { id: 'reports',      icon: 'nav-reports',        iconActive: 'nav-reports-active',      label: 'Reports',           active: false,
      children: [{ id: 'r1', label: 'Activity' }, { id: 'r2', label: 'Analytics' }] },
    { id: 'settings',     icon: 'nav-settings',       iconActive: 'nav-settings-active',     label: 'Settings',          active: false,
      children: [{ id: 's1', label: 'General' }, { id: 's2', label: 'Permissions' }] },
    { id: 'archiving',    icon: 'storage',            iconActive: 'storage',                 label: 'Project archiving', active: false },
    { id: 'recycle',      icon: 'trash',              iconActive: 'trash',                   label: 'Recycle bin',       active: false },
  ];

  get totalPages(): number {
    return Math.ceil(this.totalResults / this.pageSize);
  }

  get paginatedRows(): SearchRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.allRows.slice(start, start + this.pageSize);
  }

  get allSelected(): boolean {
    const page = this.paginatedRows;
    return page.length > 0 && page.every(r => r.selected);
  }

  get someSelected(): boolean {
    return this.paginatedRows.some(r => r.selected);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (current > 3) pages.push(-1);
    const start = Math.max(2, current - 1);
    const end   = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.paginatedRows.forEach(r => r.selected = checked);
  }

  toggleRow(row: SearchRow, event: Event): void {
    row.selected = (event.target as HTMLInputElement).checked;
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.paginatedRows.forEach(r => r.selected = false);
  }

  toggleNav(item: NavItem): void {
    if (item.children) {
      item.open = !item.open;
    }
    this.navItems.forEach(n => n.active = false);
    item.active = true;
  }

  highlight(text: string): SafeHtml {
    if (!this.searchTerm) return text;
    const escaped = this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    const html = text.replace(re, '<mark>$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  ngOnInit(): void {
    this.tracker.trackPageView('search-results-pagination');
  }
}
