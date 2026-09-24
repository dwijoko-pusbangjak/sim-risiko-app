const fs = require('fs');

let content = fs.readFileSync('scratch_mr_konteks.tsx', 'utf-8');

const newLogic = `
  const generateId = () => Date.now().toString() + Math.random().toString().slice(2, 6);

  const resetForm = () => {
    setTahun(new Date().getFullYear().toString());
    setSumberData("");
    setTujuanKL("");
    setKebijakanList([]);
    setInsidenListState([]);
    setLegacyData({});
    setIsEditMode(false);
  };

  const handleCreateNew = () => {
    resetForm();
    
    const initialKebijakan: KebijakanRow[] = [];
    if (user?.role === "eselon_1") {
      programList.forEach(prog => {
        const strat = strategisList.find(s => s.id === prog.strategisId);
        const parentName = strat ? strat.name : "-";
        const indText = prog.indikators && prog.indikators.length > 0 
          ? prog.indikators.map(i => \`- \${i.name} (Target: \${i.target})\`).join('\\n')
          : \`- \${prog.ikp} (Target: \${prog.target})\`;
        initialKebijakan.push({
          id: generateId(),
          sasaran: \`Induk: \${parentName}\\nSasaran: \${prog.name}\\nIndikator:\\n\${indText}\`,
          peraturan: "", amanat: "", pihakInternal: "", hubInternal: "", pihakEksternal: "", hubEksternal: ""
        });
      });
    } else if (user?.role === "eselon_2") {
      kegiatanList.forEach(keg => {
        const prog = programList.find(p => p.id === keg.programId);
        const parentName = prog ? prog.name : "-";
        const indText = keg.indikators && keg.indikators.length > 0 
          ? keg.indikators.map(i => \`- \${i.name} (Target: \${i.target})\`).join('\\n')
          : \`- \${keg.ikk} (Target: \${keg.target})\`;
        initialKebijakan.push({
          id: generateId(),
          sasaran: \`Induk: \${parentName}\\nSasaran: \${keg.name}\\nIndikator:\\n\${indText}\`,
          peraturan: "", amanat: "", pihakInternal: "", hubInternal: "", pihakEksternal: "", hubEksternal: ""
        });
      });
    }
    setKebijakanList(initialKebijakan);
    setIsFormVisible(true);
  };

  const handleEdit = (item: KonteksData) => {
    setKonteksId(item.id);
    setTahun(item.tahun);
    setSumberData(item.sumberData || "");
    setTujuanKL(item.tujuanKL || "");
    
    setLegacyData({
      peraturan: item.peraturan || {},
      amanatPeraturan: item.amanatPeraturan || {},
      pihakInternal: item.pihakInternal || {},
      hubunganInternal: item.hubunganInternal || {},
      pihakEksternal: item.pihakEksternal || {},
      hubunganEksternal: item.hubunganEksternal || {},
      stakeholderInternal: item.stakeholderInternal || "",
      stakeholderEksternal: item.stakeholderEksternal || "",
      sumberTemuan: item.sumberTemuan || "",
      uraianTemuan: item.uraianTemuan || "",
      penyebabTemuan: item.penyebabTemuan || ""
    });

    let parsedKebijakan = item.kebijakanList || [];
    if (parsedKebijakan.length === 0 && item.peraturan && Object.keys(item.peraturan).length > 0) {
      const list = user?.role === "eselon_1" ? programList : kegiatanList;
      parsedKebijakan = list.map(sas => {
        let parentName = "-";
        if (user?.role === "eselon_1") {
          const s = sas as SasaranProgram;
          parentName = strategisList.find(x => x.id === s.strategisId)?.name || "-";
        } else {
          const s = sas as SasaranKegiatan;
          parentName = programList.find(x => x.id === s.programId)?.name || "-";
        }
        
        const indText = sas.indikators && sas.indikators.length > 0 
          ? sas.indikators.map((i: any) => \`- \${i.name} (Target: \${i.target})\`).join('\\n')
          : \`- \${'ikp' in sas ? sas.ikp : 'ikk' in sas ? sas.ikk : ''} (Target: \${sas.target || '-'})\`;
        
        return {
          id: generateId(),
          sasaran: \`Induk: \${parentName}\\nSasaran: \${sas.name}\\nIndikator:\\n\${indText}\`,
          peraturan: item.peraturan?.[sas.id] || "",
          amanat: item.amanatPeraturan?.[sas.id] || "",
          pihakInternal: item.pihakInternal?.[sas.id] || "",
          hubInternal: item.hubunganInternal?.[sas.id] || "",
          pihakEksternal: item.pihakEksternal?.[sas.id] || "",
          hubEksternal: item.hubunganEksternal?.[sas.id] || ""
        };
      });
    }
    setKebijakanList(parsedKebijakan);

    let parsedInsiden = item.insidenList || [];
    if (parsedInsiden.length === 0 && (item.sumberTemuan || item.uraianTemuan || item.penyebabTemuan)) {
      parsedInsiden = [{
        id: generateId(),
        sumber: item.sumberTemuan || "",
        uraian: item.uraianTemuan || "",
        penyebab: item.penyebabTemuan || ""
      }];
    }
    setInsidenListState(parsedInsiden);

    setIsEditMode(true);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "mr_konteks", id));
      
      import('@/lib/logger').then(({ logActivity }) => {
        logActivity(user, "Hapus", "Penetapan Konteks", \`Menghapus Penetapan Konteks ID: \${id}\`);
      });

      toast.success("Data berhasil dihapus!");
      if (isFormVisible && id === konteksId) {
        setIsFormVisible(false);
      }
      fetchKonteksList();
    } catch (error) {
      console.error("Gagal hapus:", error);
      toast.error("Gagal menghapus data.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.unitName) return toast.error("Unit Kerja tidak ditemukan.");
    
    setIsSaving(true);
    try {
      const docId = \`\${user.unitName}-\${tahun}\`.replace(/\\s+/g, '-').toLowerCase();
      const docRef = doc(db, "mr_konteks", docId);
      
      await setDoc(docRef, {
        unitName: user.unitName,
        tahun,
        sumberData,
        tujuanKL,
        kebijakanList,
        insidenList: insidenListState,
        ...legacyData,
        updatedAt: new Date().toISOString(),
        ownerId: user.uid,
        role: user.role
      }, { merge: true });

      import('@/lib/logger').then(({ logActivity }) => {
        logActivity(user, isEditMode ? "Edit" : "Tambah", "Penetapan Konteks", \`Menyimpan Penetapan Konteks Tahun \${tahun}\`);
      });

      toast.success("Data Penetapan Konteks berhasil disimpan!");
      setIsFormVisible(false);
      fetchKonteksList();
    } catch (error: any) {
      console.error("Error saving konteks:", error);
      toast.error(\`Gagal menyimpan: \${error.message}\`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDynamicChange = (id: string, field: keyof KebijakanRow, value: string) => {
    setKebijakanList(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };
  const handleInsidenChange = (id: string, field: keyof InsidenRow, value: string) => {
    setInsidenListState(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };
`;

const newJsx = `            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-lg font-semibold text-slate-800">Kebijakan dan Daftar Pemangku Kepentingan Terkait</Label>
                  <p className="text-sm text-slate-500 mb-2">
                    Tabel ini ditarik otomatis dari master data Sasaran Kinerja. Anda dapat menambah baris baru jika diperlukan.
                  </p>
                </div>
                <Button type="button" onClick={() => setKebijakanList([...kebijakanList, { id: generateId(), sasaran: "", peraturan: "", amanat: "", pihakInternal: "", hubInternal: "", pihakEksternal: "", hubEksternal: "" }])} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" /> Tambah Baris
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-[1400px]">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-12 border-r border-b text-center align-middle" rowSpan={2}>No.</TableHead>
                      <TableHead className="w-[250px] border-r border-b text-center align-middle" rowSpan={2}>
                        Sasaran Strategis / Program / Kegiatan
                      </TableHead>
                      <TableHead className="w-[200px] border-r border-b text-center align-middle" rowSpan={2}>Nama Peraturan</TableHead>
                      <TableHead className="w-[200px] border-r border-b text-center align-middle" rowSpan={2}>Amanat Peraturan Terkait Unit Kerja</TableHead>
                      <TableHead className="w-[300px] border-r border-b text-center" colSpan={2}>Stakeholder Internal</TableHead>
                      <TableHead className="w-[300px] border-r border-b text-center" colSpan={2}>Stakeholder Eksternal</TableHead>
                      <TableHead className="w-12 border-b text-center align-middle" rowSpan={2}></TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="w-[150px] border-r border-b text-center bg-slate-50">Stakeholder</TableHead>
                      <TableHead className="w-[150px] border-r border-b text-center bg-slate-50">Hubungan</TableHead>
                      <TableHead className="w-[150px] border-r border-b text-center bg-slate-50">Stakeholder</TableHead>
                      <TableHead className="w-[150px] border-b text-center bg-slate-50">Hubungan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kebijakanList.length > 0 ? kebijakanList.map((row, idx) => (
                      <TableRow key={row.id} className="border-b">
                        <TableCell className="border-r text-center align-top p-2">{idx + 1}</TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Sasaran Kinerja..." 
                            value={row.sasaran}
                            onChange={(e) => handleDynamicChange(row.id, 'sasaran', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Ketik peraturan..." 
                            value={row.peraturan}
                            onChange={(e) => handleDynamicChange(row.id, 'peraturan', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Amanat peraturan..." 
                            value={row.amanat}
                            onChange={(e) => handleDynamicChange(row.id, 'amanat', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Pihak internal..." 
                            value={row.pihakInternal}
                            onChange={(e) => handleDynamicChange(row.id, 'pihakInternal', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Hubungan internal..." 
                            value={row.hubInternal}
                            onChange={(e) => handleDynamicChange(row.id, 'hubInternal', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Pihak eksternal..." 
                            value={row.pihakEksternal}
                            onChange={(e) => handleDynamicChange(row.id, 'pihakEksternal', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="border-r align-top p-2">
                          <Textarea 
                            placeholder="Hubungan eksternal..." 
                            value={row.hubEksternal}
                            onChange={(e) => handleDynamicChange(row.id, 'hubEksternal', e.target.value)}
                            className="min-h-[120px] w-full resize-y text-sm"
                          />
                        </TableCell>
                        <TableCell className="align-top p-2 text-center">
                          <Button type="button" variant="ghost" onClick={() => setKebijakanList(kebijakanList.filter(k => k.id !== row.id))} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center h-24 text-slate-500">
                          Belum ada baris kebijakan. Klik "Tambah Baris".
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-800">Insiden / Temuan Sebelumnya</h4>
                <Button type="button" onClick={() => setInsidenListState([...insidenListState, { id: generateId(), sumber: "", uraian: "", penyebab: "" }])} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" /> Tambah Insiden
                </Button>
              </div>
              
              {insidenListState.length > 0 ? insidenListState.map((insiden, idx) => (
                <div key={insiden.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-start p-4 border rounded-lg bg-slate-50 relative">
                  <div className="space-y-2">
                    <Label>Sumber Temuan</Label>
                    <Input 
                      placeholder="Contoh: Audit Internal, LHP BPK..." 
                      value={insiden.sumber}
                      onChange={(e) => handleInsidenChange(insiden.id, 'sumber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Uraian Temuan</Label>
                    <Textarea 
                      placeholder="Deskripsikan temuan..." 
                      value={insiden.uraian}
                      onChange={(e) => handleInsidenChange(insiden.id, 'uraian', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Penyebab Temuan</Label>
                    <Textarea 
                      placeholder="Penyebab utama dari temuan..." 
                      value={insiden.penyebab}
                      onChange={(e) => handleInsidenChange(insiden.id, 'penyebab', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="pt-8">
                    <Button type="button" variant="ghost" onClick={() => setInsidenListState(insidenListState.filter(i => i.id !== insiden.id))} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center border rounded-lg border-dashed text-slate-500">
                  Belum ada insiden / temuan sebelumnya.
                </div>
              )}
            </div>`;

content = content.replace(
  /  const resetForm = \(\) => \{[\s\S]*?(?=  if \(authLoading \|\| \(isListLoading && strategisList\.length === 0\)\) \{)/,
  newLogic + '\\n'
);

content = content.replace(
  /            <div className="space-y-4 pt-4 border-t">[\s\S]*?<div className="flex justify-end pt-4 gap-3">/,
  newJsx + '\\n            <div className="flex justify-end pt-4 gap-3">'
);

fs.writeFileSync('src/app/dashboard/mr-konteks/page.tsx', content, 'utf-8');
