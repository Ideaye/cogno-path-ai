-- Expand the public exams catalog with high-demand options used on the auth signup flow

-- Helper to insert an exam if it does not already exist (match on exact name)
INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'NEET-UG', ARRAY['NEET', 'NEET UG', 'NEET-UG'], 'UG', 200, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'NEET-UG');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'JEE Main/Advanced', ARRAY['JEE Main', 'JEE Advanced', 'IIT JEE'], 'UG', 180, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'JEE Main/Advanced');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'SSC CGL/CHSL/CPO', ARRAY['SSC CGL', 'SSC CHSL', 'SSC CPO'], 'Government', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'SSC CGL/CHSL/CPO');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'IBPS PO/Clerk', ARRAY['IBPS PO', 'IBPS Clerk'], 'Banking', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'IBPS PO/Clerk');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'SBI PO/Clerk', ARRAY['SBI PO', 'SBI Clerk'], 'Banking', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'SBI PO/Clerk');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'RRB NTPC/Group-D', ARRAY['RRB NTPC', 'RRB Group-D'], 'Railways', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'RRB NTPC/Group-D');

-- Align existing UPSC entry with preferred label
UPDATE public.exams
SET name = 'UPSC CSE prelims', alias = ARRAY['UPSC CSE (Prelims)', 'UPSC Prelims']
WHERE name = 'UPSC CSE (Prelims)';

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'CTET', ARRAY['Central Teacher Eligibility Test', 'CTET'], 'Teaching', 150, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'CTET');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'State PSC (UP/Bihar/Raj/Maha/TN/Karnataka)', ARRAY['UPPSC', 'BPSC', 'RPSC', 'MPSC', 'TNPSC', 'KPSC'], 'State PSC', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'State PSC (UP/Bihar/Raj/Maha/TN/Karnataka)');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'CUET-UG', ARRAY['Common University Entrance Test', 'CUET UG'], 'UG', 180, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'CUET-UG');

-- High-value / aspirational
INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'GATE', ARRAY['Graduate Aptitude Test in Engineering', 'GATE'], 'PG', 180, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'GATE');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'UGC NET', ARRAY['UGC-NET', 'NET'], 'PG', 180, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'UGC NET');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'CSIR-NET', ARRAY['CSIR NET'], 'PG', 180, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'CSIR-NET');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'CAPF AC', ARRAY['CAPF Assistant Commandant'], 'Defence', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'CAPF AC');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'CDS/NDA', ARRAY['CDS', 'NDA'], 'Defence', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'CDS/NDA');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'RBI Grade B', ARRAY['RBI Grade B Officer'], 'Banking', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'RBI Grade B');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'SEBI/NABARD/IRDAI', ARRAY['SEBI Grade A', 'NABARD Grade A', 'IRDAI'], 'Regulatory', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'SEBI/NABARD/IRDAI');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'SSC JE', ARRAY['SSC Junior Engineer', 'SSC JE'], 'Engineering', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'SSC JE');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'RRB JE/ALP', ARRAY['RRB JE', 'RRB ALP'], 'Railways', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'RRB JE/ALP');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'Railways technical', ARRAY['Railways Technical'], 'Railways', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'Railways technical');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'State Police SI', ARRAY['State Police Sub-Inspector'], 'Police', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'State Police SI');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'Judicial Services (prelims)', ARRAY['Judicial Services Prelims', 'Civil Judge Prelims'], 'Judiciary', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'Judicial Services (prelims)');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'MBA (CAT/XAT/NMAT/SNAP/CMAT)', ARRAY['CAT', 'XAT', 'NMAT', 'SNAP', 'CMAT'], 'Management', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'MBA (CAT/XAT/NMAT/SNAP/CMAT)');

-- Niche but strong pull
INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'Design (UCEED/CEED, NID, NIFT)', ARRAY['UCEED', 'CEED', 'NID', 'NIFT'], 'Design', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'Design (UCEED/CEED, NID, NIFT)');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'Law (CLAT/AILET)', ARRAY['CLAT', 'AILET'], 'Law', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'Law (CLAT/AILET)');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'Hospitality (NCHM JEE)', ARRAY['NCHM JEE'], 'Hospitality', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'Hospitality (NCHM JEE)');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'PG medical (INI-CET/NEET-PG per policy)', ARRAY['INI-CET', 'NEET-PG'], 'Medical', 180, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'PG medical (INI-CET/NEET-PG per policy)');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'Olympiad pathways', ARRAY['Science Olympiad', 'Math Olympiad', 'Olympiad'], 'School', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'Olympiad pathways');

INSERT INTO public.exams (name, alias, level, duration_min, is_admin_only)
SELECT 'State CETs beyond P0 geographies', ARRAY['KCET', 'MHT CET', 'WBJEE', 'KEAM', 'GUJCET'], 'State CET', 120, false
WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE name = 'State CETs beyond P0 geographies');
