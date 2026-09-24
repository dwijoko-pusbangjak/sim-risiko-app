with open('src/app/dashboard/laporan/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(r'\n\n    const blob', '\n\n    const blob')
c = c.replace(r'\n\n          {/* FOOTER TANDA', '\n\n          {/* FOOTER TANDA')
with open('src/app/dashboard/laporan/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
