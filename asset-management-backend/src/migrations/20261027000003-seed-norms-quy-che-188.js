'use strict';

/**
 * Bổ sung định mức theo Quy chế 188/QĐ-KTKT năm 2026:
 * - Trang 41: diện tích làm việc tối đa của các chức danh (m2/người).
 * - Trang 44-45: máy móc, thiết bị theo nhóm chức danh (Hiệu trưởng,
 *   Phó Hiệu trưởng, Trưởng/Phó phòng, Chuyên viên...) và thiết bị dùng chung.
 */
const DOC = '188/QĐ-KTKT';

const AREA_ROWS = [
  { position_group: 'Hiệu trưởng', max_quantity: 40 },
  { position_group: 'Phó Hiệu trưởng', max_quantity: 30 },
  { position_group: 'Trưởng phòng, Phó Trưởng phòng và các chức danh tương đương', max_quantity: 20 },
  { position_group: 'Chuyên viên và các chức danh tương đương', max_quantity: 15 },
  { position_group: 'Cá nhân ký hợp đồng lao động khác', max_quantity: 10 },
];

const GROUPS = [
  {
    position_group: 'Hiệu trưởng',
    items: [
      ['Bộ bàn ghế ngồi làm việc', 'bộ', 1, 13],
      ['Tủ đựng tài liệu', 'chiếc', 2, 7],
      ['Máy vi tính để bàn', 'bộ', 1, 20],
      ['Máy vi tính xách tay hoặc máy tính bảng hoặc thiết bị công nghệ thông tin tương đương', 'chiếc', 1, 25],
      ['Máy in', 'chiếc', 1, 13],
      ['Điện thoại cố định', 'chiếc', 1, 1.5],
      ['Bộ bàn ghế họp', 'bộ', 1, 20],
      ['Bộ bàn ghế tiếp khách', 'bộ', 1, 20],
    ],
  },
  {
    position_group: 'Phó Hiệu trưởng',
    items: [
      ['Bộ bàn ghế ngồi làm việc', 'bộ', 1, 13],
      ['Tủ đựng tài liệu', 'chiếc', 2, 7],
      ['Máy vi tính để bàn', 'bộ', 1, 20],
      ['Máy vi tính xách tay hoặc máy tính bảng hoặc thiết bị công nghệ thông tin tương đương', 'chiếc', 1, 25],
      ['Máy in', 'chiếc', 1, 13],
      ['Điện thoại cố định', 'chiếc', 1, 1.5],
      ['Bộ bàn ghế họp, tiếp khách', 'bộ', 1, 15],
    ],
  },
  {
    position_group: 'Trưởng phòng, Phó Trưởng phòng và các chức danh tương đương',
    items: [
      ['Bộ bàn ghế ngồi làm việc', 'bộ', 1, 10],
      ['Tủ đựng tài liệu', 'chiếc', 2, 7],
      ['Máy vi tính để bàn hoặc máy vi tính xách tay hoặc máy tính bảng hoặc thiết bị công nghệ thông tin tương đương', 'bộ/chiếc', 1, 20],
      ['Máy in', 'chiếc', 1, 13],
      ['Điện thoại cố định', 'chiếc', 1, 1],
      ['Bộ bàn ghế họp, tiếp khách', 'bộ', 1, 13],
    ],
  },
  {
    position_group: 'Chuyên viên và các chức danh tương đương; Cá nhân ký hợp đồng lao động',
    items: [
      ['Bộ bàn ghế ngồi làm việc', 'bộ', 1, 7],
      ['Tủ đựng tài liệu', 'chiếc', 1, 7],
      ['Máy vi tính để bàn hoặc máy vi tính xách tay hoặc máy tính bảng hoặc thiết bị công nghệ thông tin tương đương', 'bộ/chiếc', 1, 20],
      ['Điện thoại cố định', 'chiếc', 1, 1],
    ],
  },
];

const SHARED_ROWS = [
  ['Bộ bàn ghế họp, tiếp khách', 'bộ', 1, 13, '01 bộ/01 phòng làm việc'],
  ['Máy in', 'chiếc', 1, 13, '01 chiếc/03 biên chế'],
  ['Máy scan tài liệu', 'chiếc', 1, 22, '01 chiếc/15 biên chế'],
  ['Máy hủy tài liệu', 'chiếc', 1, 10, '01 chiếc/15 biên chế'],
  ['Máy photocopy', 'chiếc', 1, 110, '01 chiếc/15 biên chế'],
  ['Giá đựng tài liệu', 'chiếc', 1, 1.5, '01 chiếc/10 biên chế'],
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = [];

    for (const area of AREA_ROWS) {
      rows.push({
        scope: 'title',
        position_group: area.position_group,
        equipment_name: 'Diện tích làm việc',
        unit: 'm2',
        max_quantity: area.max_quantity,
        max_price: null,
        note: 'Diện tích làm việc tối đa (m2/người) theo Điều 46 Quy chế 188/QĐ-KTKT',
      });
    }

    for (const group of GROUPS) {
      for (const [name, unit, qty, price] of group.items) {
        rows.push({
          scope: 'title',
          position_group: group.position_group,
          equipment_name: name,
          unit,
          max_quantity: qty,
          max_price: price,
          note: 'Theo Quy chế 188/QĐ-KTKT (trang 44-45)',
        });
      }
    }

    for (const [name, unit, qty, price, note] of SHARED_ROWS) {
      rows.push({
        scope: 'room',
        position_group: null,
        equipment_name: name,
        unit,
        max_quantity: qty,
        max_price: price,
        note: `Thiết bị dùng chung: ${note} (Quy chế 188/QĐ-KTKT)`,
      });
    }

    const [existing] = await queryInterface.sequelize.query(`
      SELECT equipment_name, position_group, scope
      FROM equipment_norms
      WHERE document_no = :doc
    `, { replacements: { doc: DOC } });

    const key = (r) => `${r.scope || ''}|${r.position_group || ''}|${r.equipment_name || ''}`;
    const existingKeys = new Set((existing || []).map(key));
    const toInsert = rows.filter((r) => !existingKeys.has(key(r)));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('equipment_norms', toInsert.map((r) => ({
        ...r,
        document_no: DOC,
        effective_date: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      })));
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DELETE FROM equipment_norms WHERE document_no = :doc',
      { replacements: { doc: DOC } },
    );
  },
};
