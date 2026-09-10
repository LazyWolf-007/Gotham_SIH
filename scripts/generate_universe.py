"""Operation Grey Ledger — generate data/raw ONCE. Refuses to overwrite gold."""

from __future__ import annotations

import csv
import json
import random
import sys
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
UNIVERSE = RAW / "universe.json"
IST = timezone(timedelta(hours=5, minutes=30))
SEED = 26189

# Frozen 8. Never emit ASSOCIATED.
LINK_OK = {"CALLED", "PAID", "OWNS", "USES", "SEEN_AT", "MEMBER_OF", "MENTIONED_IN", "SAME_AS"}
RESIDUAL_OK = {"CALLED", "PAID", "OWNS", "USES", "MEMBER_OF", "SEEN_AT"}


def ts(dt: datetime) -> str:
    return dt.astimezone(IST).isoformat()


def prov(source_type: str, source_id: str, snippet: str) -> dict:
    return {"source_type": source_type, "source_id": source_id, "snippet": snippet}


def already_generated() -> bool:
    if not UNIVERSE.exists() or UNIVERSE.stat().st_size < 8:
        return False
    try:
        data = json.loads(UNIVERSE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return False
    return bool(data.get("gold", {}).get("accountant_id"))


def bfs_path(adj: dict[str, set[str]], start: str, goals: set[str], banned: set[str] | None = None):
    banned = banned or set()
    if start in banned:
        return None
    q = deque([start])
    parent = {start: None}
    while q:
        cur = q.popleft()
        if cur in goals and cur != start:
            path = [cur]
            while parent[path[-1]] is not None:
                path.append(parent[path[-1]])
            path.reverse()
            return path
        for nxt in adj[cur]:
            if nxt in banned or nxt in parent:
                continue
            parent[nxt] = cur
            q.append(nxt)
    return None


def add_undirected(adj: dict[str, set[str]], a: str, b: str) -> None:
    adj[a].add(b)
    adj[b].add(a)


def main() -> None:
    if already_generated():
        print("Universe already generated. Refusing to overwrite. (CONTEXT: generate ONCE)")
        sys.exit(1)

    rng = random.Random(SEED)
    RAW.mkdir(parents=True, exist_ok=True)

    # --- names (synthetic; no living public figures) ---
    firsts = [
        "Naveen", "Vikram", "Imtiaz", "Roshni", "Farhan", "Rakesh", "Meenal", "Sushil",
        "Parvinder", "Gulshan", "Kavita", "Harish", "Zubair", "Pallavi", "Dinesh", "Shabnam",
        "Manoj", "Iqbal", "Trupti", "Yogesh", "Rafiq", "Namrata", "Bhavesh", "Saira",
        "Wasim", "Pradeep", "Nasreen", "Anuj", "Firoz", "Swati", "Omkar", "Hina",
        "Rehana", "Tushar", "Asma", "Gopal", "Nilofer", "Rajan", "Bushra", "Nitin",
        "Samina", "Paresh", "Yasmin", "Kishore", "Afroz", "Uday", "Rukhsana", "Jatin",
        "Naseem", "Farida", "Shireen", "Vinod", "Bhaskar", "Heena", "Sagar", "Rukhsar",
        "Milind", "Tamanna", "Nilesh", "Parveen", "Ketan", "Shabina", "Alok", "Nargis",
        "Pranav", "Zarina", "Hemant", "Sultana", "Chirag", "Mehrun", "Atul", "Shabina2",
        "Rohan", "Kulsum", "Deepak", "Salma", "Nagesh", "Razia", "Pravin", "Najma",
    ]
    lasts = [
        "Bhatia", "Haleja", "Qureshi", "Talreja", "Lodhi", "Mundhe", "Khatri", "Ambwani",
        "Chitnis", "Makhija", "Nadkarni", "Tandel", "Memon", "Pingle", "Barot", "Lakhani",
        "Upasani", "Divekar", "Bhandare", "Rangnekar", "Padhye", "Sawant", "Kazi", "Bhosale",
        "Merchant", "Qazi", "Contractor", "Ambavne", "Tawde", "Mhapankar",
    ]
    used_names: set[tuple[str, str]] = set()

    def synth_name(i: int) -> str:
        for _ in range(200):
            fn, ln = firsts[i % len(firsts)], lasts[(i * 7) % len(lasts)]
            if i >= 12:
                fn = firsts[(i * 3) % len(firsts)]
                ln = lasts[(i * 11 + 5) % len(lasts)]
            pair = (fn, ln)
            if pair not in used_names and fn != "Shabina2":
                used_names.add(pair)
                return f"{fn} {ln}"
            i += 1
        return f"Person {i}"

    # --- locations (8) ---
    locations = [
        {"id": "loc:azadpur_mandi", "name": "Azadpur Sabzi Mandi", "area": "North Delhi"},
        {"id": "loc:okhla_industrial", "name": "Okhla Industrial Area Phase II", "area": "South Delhi"},
        {"id": "loc:noida_sec63", "name": "Noida Sector 63", "area": "Gautam Buddha Nagar"},
        {"id": "loc:sadar_bazar", "name": "Sadar Bazar", "area": "Central Delhi"},
        {"id": "loc:dwarka_sec21", "name": "Dwarka Sector 21", "area": "South West Delhi"},
        {"id": "loc:ghazipur_yard", "name": "Ghazipur Fruit Market", "area": "East Delhi"},
        {"id": "loc:karol_bagh", "name": "Karol Bagh", "area": "Central Delhi"},
        {"id": "loc:udyog_vihar", "name": "Udyog Vihar", "area": "Gurugram"},
    ]
    mandi_location_id = "loc:azadpur_mandi"

    # --- orgs (10) ---
    orgs = [
        {"id": "org:qadir_cold_store", "name": "Qadir Cold Store"},
        {"id": "org:panchsheel_spices", "name": "Panchsheel Spices"},
        {"id": "org:jamuna_transport", "name": "Jamuna Transport Co"},
        {"id": "org:haleja_holdings", "name": "Haleja Holdings LLP"},
        {"id": "org:bhatia_associates", "name": "Bhatia Associates"},
        {"id": "org:silver_lotus_traders", "name": "Silver Lotus Traders Pvt Ltd"},
        {"id": "org:kailash_agro", "name": "Kailash Agro Pvt Ltd"},
        {"id": "org:mehra_logistics", "name": "Mehra Logistics"},
        {"id": "org:narmada_exports", "name": "Narmada Exports"},
        {"id": "org:orbit_packers", "name": "Orbit Packers"},
    ]
    mandi_orgs = {"org:qadir_cold_store", "org:panchsheel_spices", "org:jamuna_transport"}
    front_org_ids = [
        "org:silver_lotus_traders",
        "org:kailash_agro",
        "org:mehra_logistics",
        "org:narmada_exports",
        "org:orbit_packers",
    ]

    # --- persons (80) ---
    cast = [
        ("naveen_bhatia", "Naveen Bhatia"),
        ("vikram_haleja", "Vikram Haleja"),
        ("imtiaz_qureshi", "Imtiaz Qureshi"),
        ("rakesh_mundhe", "Rakesh Mundhe"),
        ("farhan_lodhi", "Farhan Lodhi"),
        ("roshni_talreja", "Roshni Talreja"),
        ("sushil_ambwani", "Sushil Ambwani"),
        ("meenal_chitnis", "Meenal Chitnis"),
        ("parvinder_makhija", "Parvinder Makhija"),
        ("gulshan_khatri", "Gulshan Khatri"),
        ("kavita_nadkarni", "Kavita Nadkarni"),
        ("harish_tandel", "Harish Tandel"),
    ]
    used_names.update((n.split()[0], n.split()[1]) for _, n in cast)
    persons = [{"id": f"person:{slug}", "name": name} for slug, name in cast]
    while len(persons) < 80:
        i = len(persons)
        persons.append({"id": f"person:p{i:02d}", "name": synth_name(i)})

    accountant_id = "person:naveen_bhatia"
    kingpin_id = "person:vikram_haleja"
    lookout_id = "person:rakesh_mundhe"
    runner_id = "person:farhan_lodhi"
    mandi_handler_id = "person:imtiaz_qureshi"

    # --- phones (40) ---
    phones = []
    for i in range(40):
        msisdn = f"98{10000000 + i * 173 + (SEED % 97):08d}"[-10:]
        msisdn = "9" + msisdn[1:]
        phones.append({
            "id": f"phone:ph{i:02d}",
            "msisdn": msisdn,
            "imei": f"3567{i:02d}{26189 + i * 13:08d}"[:15],
            "prepaid": i % 3 != 0,
        })
    phone_acc = "phone:ph00"
    phone_king = "phone:ph01"
    phone_res1 = "phone:ph02"
    phone_res2 = "phone:ph03"
    phone_burst = "phone:ph03"  # runner burner — CDR spike
    phone_handler = "phone:ph04"
    phone_ids = [p["id"] for p in phones]
    imei_of = {p["id"]: p["imei"] for p in phones}

    # --- accounts (30) ---
    banks = ["HDFC", "ICICI", "SBI", "AXIS", "PNB", "BOB"]
    accounts = []
    for i in range(30):
        bank = banks[i % len(banks)]
        accounts.append({
            "id": f"acc:a{i:02d}",
            "number": f"{bank[:3]}{100000000 + i * 4099 + SEED}",
            "bank": bank,
        })
    acc_in = "acc:a00"
    acc_out = "acc:a01"
    mule_account_ids = [f"acc:a{i:02d}" for i in range(2, 8)]  # a02..a07
    hawala_cycle = ["acc:a02", "acc:a03", "acc:a08", "acc:a09", "acc:a02"]  # mules + fronts
    hawala_cycle_account_ids = ["acc:a02", "acc:a03", "acc:a08", "acc:a09"]
    kingpin_acc = "acc:a10"
    mandi_accounts = [f"acc:a{i:02d}" for i in range(11, 18)]  # a11..a17
    civilian_accounts = [f"acc:a{i:02d}" for i in range(18, 30)]  # a18..a29

    # --- vehicles (25) ---
    vehicles = []
    prefixes = ["DL1C", "DL3C", "DL4S", "HR26", "UP16", "DL8C"]
    kinds = ["motorcycle", "tempo", "car", "pickup"]
    for i in range(25):
        vehicles.append({
            "id": f"veh:v{i:02d}",
            "plate": f"{prefixes[i % 6]}{chr(65 + (i % 26))}{1000 + i * 17}",
            "kind": kinds[i % 4],
            "color": ["white", "silver", "blue", "grey"][i % 4],
        })

    cameras = [
        {"id": "cam:azadpur_gate", "code": "CCTV-AZD-01", "location_id": "loc:azadpur_mandi"},
        {"id": "cam:azadpur_yard", "code": "CCTV-AZD-07", "location_id": "loc:azadpur_mandi"},
        {"id": "cam:okhla_shed", "code": "CCTV-OKH-03", "location_id": "loc:okhla_industrial"},
        {"id": "cam:noida_lobby", "code": "CCTV-NOI-11", "location_id": "loc:noida_sec63"},
        {"id": "cam:karol_lane", "code": "CCTV-KRB-02", "location_id": "loc:karol_bagh"},
        {"id": "cam:udyog_bay", "code": "CCTV-UDY-04", "location_id": "loc:udyog_vihar"},
    ]

    t0 = datetime(2026, 1, 5, 8, 0, tzinfo=IST)
    fir_burst_time = datetime(2026, 4, 12, 11, 40, tzinfo=IST)

    links: list[dict] = []

    def link(typ: str, source: str, target: str, attributes: dict) -> None:
        if typ not in LINK_OK:
            raise RuntimeError(f"forbidden link type {typ}")
        if typ == "ASSOCIATED":
            raise RuntimeError("ASSOCIATED is forbidden")
        links.append({"type": typ, "source": source, "target": target, "attributes": attributes})

    # OWNS — accountant owns inbound+outbound ledgers and one phone (low degree)
    link("OWNS", accountant_id, phone_acc, prov("universe", "owns-acc-phone", "SIM registered to Naveen Bhatia"))
    link("OWNS", accountant_id, acc_in, prov("universe", "owns-acc-in", "HDFC inbound ledger of Bhatia Associates"))
    link("OWNS", accountant_id, acc_out, prov("universe", "owns-acc-out", "ICICI outbound ledger of Bhatia Associates"))
    link("MEMBER_OF", accountant_id, "org:bhatia_associates", {**prov("universe", "mem-bhatia", "proprietor"), "role": "proprietor"})

    link("OWNS", kingpin_id, phone_king, prov("universe", "owns-king-phone", "prepaid in Haleja name"))
    link("OWNS", kingpin_id, kingpin_acc, prov("universe", "owns-king-acc", "Haleja Holdings current account"))
    link("MEMBER_OF", kingpin_id, "org:haleja_holdings", {**prov("universe", "mem-haleja", "designated partner"), "role": "designated_partner"})

    link("OWNS", lookout_id, phone_res1, prov("universe", "owns-res1", "Mundhe personal handset"))
    link("USES", runner_id, phone_res2, {**prov("universe", "uses-res2", "Lodhi using prepaid burner"), "at": ts(fir_burst_time - timedelta(days=20))})
    link("OWNS", runner_id, mule_account_ids[0], prov("universe", "owns-mule0", "Lodhi is signatory on first mule account"))
    link("OWNS", runner_id, phone_ids[5], prov("universe", "owns-runner-personal", "Lodhi personal"))

    link("OWNS", mandi_handler_id, phone_handler, prov("universe", "owns-handler-ph", "Qureshi mandi phone"))
    link("OWNS", mandi_handler_id, mandi_accounts[0], prov("universe", "owns-handler-acc", "Qadir Cold Store collections"))
    link("MEMBER_OF", mandi_handler_id, "org:qadir_cold_store", {**prov("universe", "mem-qadir", "manager"), "role": "manager"})
    link("MEMBER_OF", lookout_id, "org:panchsheel_spices", {**prov("universe", "mem-lookout", "yard supervisor"), "role": "yard_supervisor"})
    link("MEMBER_OF", runner_id, "org:orbit_packers", {**prov("universe", "mem-runner-front", "dispatch clerk on paper"), "role": "dispatch_clerk"})
    link("MEMBER_OF", "person:harish_tandel", "org:jamuna_transport", {**prov("universe", "mem-jamuna", "owner"), "role": "owner"})
    link("MEMBER_OF", "person:kavita_nadkarni", "org:panchsheel_spices", {**prov("universe", "mem-panch", "partner"), "role": "partner"})

    directors = [
        ("person:roshni_talreja", "org:silver_lotus_traders", "acc:a08"),
        ("person:sushil_ambwani", "org:kailash_agro", "acc:a09"),
        ("person:meenal_chitnis", "org:narmada_exports", mule_account_ids[1]),
        ("person:parvinder_makhija", "org:orbit_packers", mule_account_ids[2]),
        ("person:gulshan_khatri", "org:mehra_logistics", mule_account_ids[3]),
    ]
    for i, (pid, oid, aid) in enumerate(directors):
        ph = phone_ids[6 + i]
        link("OWNS", pid, ph, prov("universe", f"owns-dir-ph-{i}", "director handset"))
        link("OWNS", pid, aid, prov("universe", f"owns-dir-acc-{i}", "director signatory"))
        link("MEMBER_OF", pid, oid, {**prov("universe", f"mem-dir-{i}", "director"), "role": "director"})

    # remaining mule accounts owned by later persons (front cluster)
    for i, acc in enumerate(mule_account_ids[4:]):
        pid = persons[12 + i]["id"]
        link("OWNS", pid, acc, prov("universe", f"owns-mule-{4+i}", "paper signatory"))
        link("MEMBER_OF", pid, front_org_ids[i % len(front_org_ids)], {**prov("universe", f"mem-mule-{i}", "nominee"), "role": "nominee"})

    # remaining mandi accounts
    mandi_owners = [mandi_handler_id, "person:kavita_nadkarni", "person:harish_tandel"]
    for i, acc in enumerate(mandi_accounts[1:], start=1):
        pid = mandi_owners[i % len(mandi_owners)] if i < 3 else persons[20 + i]["id"]
        link("OWNS", pid, acc, prov("universe", f"owns-mandi-acc-{i}", "mandi collections"))
        if i >= 3:
            link("MEMBER_OF", pid, list(mandi_orgs)[i % 3], {**prov("universe", f"mem-mandi-{i}", "trader"), "role": "trader"})

    # fill remaining phones/accounts/vehicles with civilians — no cross-partition OWNS
    claimed_phones = {e["target"] for e in links if e["type"] == "OWNS" and e["target"].startswith("phone:")}
    claimed_phones |= {e["target"] for e in links if e["type"] == "USES" and e["target"].startswith("phone:")}
    claimed_acc = {e["target"] for e in links if e["type"] == "OWNS" and e["target"].startswith("acc:")}
    civ_start = 30
    pi = civ_start
    for ph in phone_ids:
        if ph in claimed_phones:
            continue
        while persons[pi]["id"] in {accountant_id, kingpin_id}:
            pi += 1
        link("OWNS", persons[pi]["id"], ph, prov("universe", f"owns-civ-ph-{pi}", "subscriber KYC"))
        pi += 1
    for acc in civilian_accounts:
        if acc in claimed_acc:
            continue
        link("OWNS", persons[pi]["id"], acc, prov("universe", f"owns-civ-acc-{pi}", "savings KYC"))
        pi += 1
        pi = min(pi, 79)

    # Vehicles stay inside partitions so RC ownership cannot bridge mandi → mules.
    veh_owners = {
        "veh:v00": mandi_handler_id,
        "veh:v01": lookout_id,
        "veh:v04": runner_id,
        "veh:v10": "person:parvinder_makhija",
        "veh:v12": "person:roshni_talreja",
    }
    civ_veh_i = 40
    for veh in vehicles:
        owner = veh_owners.get(veh["id"])
        if owner is None:
            owner = persons[civ_veh_i]["id"]
            civ_veh_i = min(civ_veh_i + 1, 79)
        link("OWNS", owner, veh["id"], prov("universe", f"owns-{veh['id']}", "RC owner"))

    # USES: handler uses a tempo sometimes
    link("USES", mandi_handler_id, "veh:v00", {**prov("universe", "uses-tempo", "Qureshi using Jamuna tempo"), "at": ts(t0 + timedelta(days=20))})

    mandi_person_ids = sorted({
        e["source"] for e in links
        if e["type"] == "MEMBER_OF" and e["target"] in mandi_orgs
    } | {lookout_id, mandi_handler_id})

    towers = {
        "loc:azadpur_mandi": "AZD-12",
        "loc:okhla_industrial": "OKH-04",
        "loc:noida_sec63": "NOI-63",
        "loc:sadar_bazar": "SBR-02",
        "loc:dwarka_sec21": "DWK-21",
        "loc:ghazipur_yard": "GZP-09",
        "loc:karol_bagh": "KRB-08",
        "loc:udyog_vihar": "UDY-01",
    }
    tower_list = list(towers.values())

    # --- CDRs (3000) ---
    cdrs: list[dict] = []

    def add_cdr(when: datetime, caller: str, callee: str, dur: int, tower: str) -> None:
        if caller == callee:
            return
        cdrs.append({
            "timestamp": ts(when),
            "caller": caller,
            "callee": callee,
            "duration_s": dur,
            "cell_tower": tower,
            "imei": imei_of[caller],
        })

    # residual CALLED: lookout phone <-> runner burner (thin path)
    for k in range(6):
        when = t0 + timedelta(days=30 + k * 12, hours=21, minutes=5 * k)
        a, b = (phone_res1, phone_res2) if k % 2 == 0 else (phone_res2, phone_res1)
        add_cdr(when, a, b, 40 + k, towers[mandi_location_id])

    # kingpin rarely calls accountant (not a residual bridge to mules)
    add_cdr(t0 + timedelta(days=40, hours=7), phone_king, phone_acc, 92, towers["loc:karol_bagh"])
    add_cdr(t0 + timedelta(days=88, hours=19), phone_acc, phone_king, 61, towers["loc:karol_bagh"])

    # accountant few calls to handler (primary voice bridge — person still low degree)
    add_cdr(t0 + timedelta(days=15, hours=10), phone_handler, phone_acc, 120, towers[mandi_location_id])
    add_cdr(t0 + timedelta(days=16, hours=10), phone_acc, phone_handler, 80, towers["loc:karol_bagh"])

    # mule_burst: phone_res2 CDR spike after FIR time
    burst_end = fir_burst_time + timedelta(hours=36)
    others = [p for p in phone_ids if p != phone_burst]
    for k in range(140):
        when = fir_burst_time + timedelta(minutes=8 * k + rng.randint(0, 5))
        if when > burst_end:
            when = fir_burst_time + timedelta(minutes=rng.randint(1, 200))
        other = others[k % len(others)]
        caller, callee = (phone_burst, other) if k % 3 else (other, phone_burst)
        add_cdr(when, caller, callee, rng.randint(12, 90), towers["loc:okhla_industrial"] if k % 2 else towers[mandi_location_id])

    # community chatter
    mandi_phones = [phone_handler, phone_res1, phone_ids[4], phone_ids[20], phone_ids[21]]
    front_phones = phone_ids[6:12]
    while len(cdrs) < 3000:
        if rng.random() < 0.35:
            a, b = rng.sample(mandi_phones, 2) if len(mandi_phones) > 1 else rng.sample(phone_ids, 2)
        elif rng.random() < 0.5:
            a, b = rng.sample(front_phones, 2) if len(front_phones) > 1 else rng.sample(phone_ids, 2)
        else:
            a, b = rng.sample(phone_ids, 2)
        # do not create extra CALLED from mandi phones to mule-side phones except residual
        mule_side_phones = {phone_res2, phone_burst, *phone_ids[6:12]}
        if a in {phone_handler, *mandi_phones} and b in mule_side_phones and {a, b} != {phone_res1, phone_res2}:
            if not ({a, b} <= {phone_res1, phone_res2}):
                continue
        day = rng.randint(0, 160)
        when = t0 + timedelta(days=day, hours=rng.randint(6, 22), minutes=rng.randint(0, 59), seconds=rng.randint(0, 59))
        add_cdr(when, a, b, rng.randint(8, 600), rng.choice(tower_list))
    cdrs = cdrs[:3000]

    # --- payments (800) ---
    txns: list[dict] = []

    def add_txn(when: datetime, src: str, dst: str, amount: int, channel: str, note: str) -> None:
        if src == dst:
            return
        txns.append({
            "timestamp": ts(when),
            "src_account": src,
            "dst_account": dst,
            "amount_inr": amount,
            "channel": channel,
            "note": note,
        })

    # mandi -> accountant inbound (primary money)
    for k in range(220):
        src = mandi_accounts[k % len(mandi_accounts)]
        when = t0 + timedelta(days=rng.randint(5, 140), hours=rng.randint(9, 18))
        add_txn(when, src, acc_in, rng.randint(45000, 280000), "NEFT", "produce settlement")

    # accountant outbound -> mules
    for k in range(220):
        dst = mule_account_ids[k % len(mule_account_ids)]
        when = t0 + timedelta(days=rng.randint(6, 145), hours=rng.randint(10, 19))
        add_txn(when, acc_out, dst, rng.randint(40000, 260000), "RTGS", "consultancy / packing")

    # PAID cycle among front firms / mule accounts
    cycle_pairs = list(zip(hawala_cycle, hawala_cycle[1:]))
    for k in range(48):
        src, dst = cycle_pairs[k % len(cycle_pairs)]
        when = t0 + timedelta(days=20 + k * 2, hours=14, minutes=k % 50)
        add_txn(when, src, dst, rng.randint(90000, 175000), "IMPS", "inter-firm adjustment")

    # partition-safe noise: mandi internal, mule internal, civilian internal
    while len(txns) < 800:
        r = rng.random()
        if r < 0.33:
            src, dst = rng.sample(mandi_accounts, 2)
            note, ch = "yard cash pooling", "UPI"
        elif r < 0.66:
            pool = mule_account_ids + hawala_cycle_account_ids
            src, dst = rng.sample(pool, 2)
            note, ch = "packing credit", "NEFT"
        else:
            src, dst = rng.sample(civilian_accounts, 2)
            note, ch = "personal transfer", "UPI"
        when = t0 + timedelta(days=rng.randint(0, 160), hours=rng.randint(8, 21))
        add_txn(when, src, dst, rng.randint(1500, 90000), ch, note)
    txns = txns[:800]

    # --- FIRs (60 paragraphs) ---
    stations = [
        ("Azadpur PS", "loc:azadpur_mandi"),
        ("Okhla PS", "loc:okhla_industrial"),
        ("Noida Sec 63 PS", "loc:noida_sec63"),
        ("Sadar Bazar PS", "loc:sadar_bazar"),
        ("Dwarka PS", "loc:dwarka_sec21"),
        ("Ghazipur PS", "loc:ghazipur_yard"),
        ("Karol Bagh PS", "loc:karol_bagh"),
        ("Udyog Vihar PS", "loc:udyog_vihar"),
    ]
    offences = [
        ("Cheating and criminal conspiracy", "420/120B IPC"),
        ("Criminal breach of trust", "406/120B IPC"),
        ("Theft of goods", "379 IPC"),
        ("Receiving stolen property", "411 IPC"),
        ("Forgery for purpose of cheating", "468/420 IPC"),
        ("Criminal intimidation", "506 IPC"),
        ("Voluntarily causing hurt", "323 IPC"),
        ("Mischief", "427 IPC"),
    ]
    sis = ["SI R. K. Solanki", "SI Preeti Jangra", "SI Wasim Khan", "SI D. N. Yadav", "SI Asha Rana"]
    # "Wasim Khan" as SI is a generic rank name; not a public figure.

    fir_burst_id = "FIR-2026-014"
    firs: list[dict] = []
    for i in range(60):
        n = i + 1
        fid = f"FIR-2026-{n:03d}"
        station, loc = stations[i % len(stations)]
        offence, sections = offences[i % len(offences)]
        when = t0 + timedelta(days=2 * i + (12 if n == 14 else 0), hours=9 + (i % 8), minutes=10 * (i % 5))
        if n == 14:
            when = fir_burst_time
            station, loc = "Azadpur PS", mandi_location_id
            offence, sections = "Cheating and criminal conspiracy", "420/120B IPC"
        complainant = persons[30 + (i % 50)]
        named = [complainant["id"]]
        extra_person = persons[40 + (i % 30)]
        if i % 4 == 0:
            named.append(extra_person["id"])
        if n in {9, 14, 22} and lookout_id not in named:
            named.append(lookout_id)
        if n in {14, 31} and mandi_handler_id not in named:
            named.append(mandi_handler_id)
        si = sis[i % len(sis)]
        if n == 14:
            narrative = (
                f"On {when.strftime('%d.%m.%Y')} at about {when.strftime('%H%M')} hours, complainant "
                f"{complainant['name']} r/o Timarpur stated that traders at Azadpur Sabzi Mandi are being "
                f"induced to transfer produce-sale proceeds to unknown 'consulting' accounts against fabricated "
                f"GST invoices. The undersigned {si} recorded the statement u/s 154 CrPC. Case registered "
                f"u/s {sections} at PS Azadpur. Investigation taken up. IO directed to collect CDR and "
                f"account statements of the suspected mule channels."
            )
        elif loc == mandi_location_id:
            narrative = (
                f"On {when.strftime('%d.%m.%Y')} at about {when.strftime('%H%M')} hours, complainant "
                f"{complainant['name']} r/o Azadpur village attended PS and stated that unknown persons "
                f"came on a motorcycle near Gate No. 2 of the mandi and {offence.lower()}. The undersigned "
                f"{si} proceeded to the spot, prepared a rukka, and registered the case u/s {sections} "
                f"at {station}. Enquiry from neighbouring shopkeepers is continuing."
            )
        else:
            narrative = (
                f"On {when.strftime('%d.%m.%Y')} at about {when.strftime('%H%M')} hours, complainant "
                f"{complainant['name']} r/o the local area stated that the accused persons cheated him in "
                f"the matter of {offence.lower()}. Statement recorded. Case registered u/s {sections} at "
                f"{station}. The undersigned {si} took up investigation. No living public figure is named. "
                f"Further action as per law."
            )
        firs.append({
            "id": fid,
            "station": station,
            "date": ts(when),
            "offence": offence,
            "complainant": complainant["id"],
            "location": loc,
            "named": named,
            "narrative": narrative,
            "sections": sections,
        })
        for pid in named:
            role = "complainant" if pid == complainant["id"] else "mentioned"
            link("MENTIONED_IN", pid, fid, {**prov("fir", fid, narrative[:180]), "role": role})

    # --- surveillance (15) ---
    surv: list[dict] = []

    def add_surv(when: datetime, cam: dict, person_id: str | None, vehicle_id: str | None, conf: float) -> None:
        note = {
            "timestamp": ts(when),
            "camera_id": cam["id"],
            "location_id": cam["location_id"],
            "person_id": person_id or "",
            "vehicle_id": vehicle_id or "",
            "plate": next((v["plate"] for v in vehicles if v["id"] == vehicle_id), ""),
            "confidence": conf,
        }
        surv.append(note)
        if person_id:
            link("SEEN_AT", person_id, cam["id"], {**prov("surv", cam["id"], f"face match {person_id}"), "at": ts(when), "confidence": conf})
            link("SEEN_AT", person_id, cam["location_id"], {**prov("surv", cam["id"], f"at {cam['location_id']}"), "at": ts(when), "confidence": conf})
        if vehicle_id:
            link("SEEN_AT", vehicle_id, cam["id"], {**prov("surv", cam["id"], f"plate {note['plate']}"), "at": ts(when), "confidence": conf})

    # Mandi cameras: mandi side only. Runner only at Okhla/Noida so residual is the phones.
    add_surv(t0 + timedelta(days=50, hours=18, minutes=10), cameras[0], lookout_id, "veh:v01", 0.86)
    add_surv(t0 + timedelta(days=50, hours=18, minutes=25), cameras[1], mandi_handler_id, "veh:v00", 0.84)
    add_surv(fir_burst_time + timedelta(hours=3), cameras[0], lookout_id, None, 0.9)
    add_surv(fir_burst_time + timedelta(hours=4), cameras[2], runner_id, "veh:v04", 0.77)
    add_surv(t0 + timedelta(days=70, hours=11), cameras[4], accountant_id, None, 0.72)
    add_surv(t0 + timedelta(days=33, hours=16), cameras[0], mandi_handler_id, "veh:v00", 0.88)
    add_surv(t0 + timedelta(days=90, hours=9), cameras[3], "person:roshni_talreja", None, 0.69)
    add_surv(t0 + timedelta(days=91, hours=9), cameras[5], "person:parvinder_makhija", "veh:v10", 0.74)
    add_surv(t0 + timedelta(days=41, hours=20), cameras[1], lookout_id, None, 0.8)
    add_surv(t0 + timedelta(days=55, hours=7), cameras[2], runner_id, None, 0.6)
    add_surv(t0 + timedelta(days=66, hours=21), cameras[0], "person:kavita_nadkarni", "veh:v08", 0.64)
    add_surv(t0 + timedelta(days=77, hours=13), cameras[3], "person:sushil_ambwani", None, 0.58)
    add_surv(t0 + timedelta(days=80, hours=17), cameras[5], None, "veh:v12", 0.71)
    add_surv(t0 + timedelta(days=100, hours=10), cameras[4], persons[50]["id"], None, 0.55)
    add_surv(t0 + timedelta(days=110, hours=19), cameras[1], lookout_id, None, 0.83)
    assert len(surv) == 15

    # --- verify residual path & accountant cut ---
    adj: dict[str, set[str]] = defaultdict(set)
    for e in links:
        if e["type"] in RESIDUAL_OK:
            add_undirected(adj, e["source"], e["target"])
    for row in cdrs:
        add_undirected(adj, row["caller"], row["callee"])
    for row in txns:
        add_undirected(adj, row["src_account"], row["dst_account"])

    mule_set = set(mule_account_ids)
    path_via = None
    for mp in mandi_person_ids:
        path_via = bfs_path(adj, mp, mule_set)
        if path_via:
            break
    if not path_via:
        raise RuntimeError("no path from mandi people to mule accounts")

    # Gold residual: mandi lookout → ph02 → ph03 → runner → mule a02 (no accountant).
    residual = [lookout_id, phone_res1, phone_res2, runner_id, mule_account_ids[0]]
    banned = {accountant_id}
    for a, b in zip(residual, residual[1:]):
        if accountant_id in (a, b):
            raise RuntimeError("gold residual touches accountant")
        if a in banned or b in banned:
            raise RuntimeError("gold residual banned")
        if b not in adj[a]:
            raise RuntimeError(f"gold residual missing edge {a} -- {b}")
    any_residual = None
    for mp in mandi_person_ids:
        any_residual = bfs_path(adj, mp, mule_set, banned={accountant_id})
        if any_residual:
            break
    if not any_residual:
        raise RuntimeError("no residual path after removing accountant")

    acc_degree = len(adj[accountant_id])
    if acc_degree > 8:
        raise RuntimeError(f"accountant degree too high: {acc_degree}")

    gold = {
        "accountant_id": accountant_id,
        "kingpin_id": kingpin_id,
        "mandi_location_id": mandi_location_id,
        "mule_account_ids": mule_account_ids,
        "residual_phone_ids": [phone_res1, phone_res2],
        "hawala_cycle_account_ids": hawala_cycle_account_ids,
        "mule_burst_phone_id": phone_burst,
        "mule_burst_fir_id": fir_burst_id,
        "mule_burst_after": ts(fir_burst_time),
        "front_org_ids": front_org_ids,
        "mandi_person_ids": mandi_person_ids,
        "residual_path": residual,
        "accountant_degree": acc_degree,
    }

    universe = {
        "case": "Operation Grey Ledger",
        "problem": "SIH26189",
        "generated_once": True,
        "seed": SEED,
        "gold": gold,
        "objects": {
            "Person": persons,
            "Phone": phones,
            "Account": accounts,
            "Organization": orgs,
            "Location": locations,
            "Camera": cameras,
            "Vehicle": vehicles,
            "FIR": [{"id": f["id"], "station": f["station"], "offence": f["offence"], "filed_at": f["date"]} for f in firs],
        },
        "links": links,
        "counts": {
            "persons": len(persons),
            "phones": len(phones),
            "orgs": len(orgs),
            "accounts": len(accounts),
            "vehicles": len(vehicles),
            "locations": len(locations),
            "firs": len(firs),
            "cdrs": len(cdrs),
            "payments": len(txns),
            "surveillance": len(surv),
        },
    }

    UNIVERSE.write_text(json.dumps(universe, indent=2), encoding="utf-8")

    fir_md = []
    for f in firs:
        named = ", ".join(f["named"])
        fir_md.append(
            f"## {f['id']}\n"
            f"- id: {f['id']}\n"
            f"- station: {f['station']}\n"
            f"- date: {f['date']}\n"
            f"- offence: {f['offence']}\n"
            f"- complainant: {f['complainant']}\n"
            f"- location: {f['location']}\n"
            f"- named: {named}\n"
            f"- narrative: |\n"
            f"    {f['narrative']}\n"
        )
    (RAW / "firs.md").write_text("\n".join(fir_md), encoding="utf-8")

    with (RAW / "cdr.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["timestamp", "caller", "callee", "duration_s", "cell_tower", "imei"])
        w.writeheader()
        w.writerows(cdrs)

    with (RAW / "txn.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["timestamp", "src_account", "dst_account", "amount_inr", "channel", "note"])
        w.writeheader()
        w.writerows(txns)

    (RAW / "surveillance.json").write_text(json.dumps(surv, indent=2), encoding="utf-8")

    bible = [
        "Operation Grey Ledger: Azadpur mandi produce cash is skimmed into NCR front firms.",
        "Kingpin Vikram Haleja (Haleja Holdings) never signs the books and almost never calls.",
        "Accountant Naveen Bhatia splits money across two ledgers he owns: inbound a00, outbound a01.",
        "Mandi traders pay a00; Bhatia pays mule accounts a02–a07 from a01. He is the cut-point.",
        "Front firms rotate a PAID cycle a02→a03→a08→a09→a02 (hawala_cycle).",
        "FIR-2026-014 (12 Apr 2026, Azadpur, u/s 420/120B IPC) triggers a CDR spike on Farhan Lodhi's burner ph03.",
        "Rakesh Mundhe (ph02) is the mandi lookout; Lodhi uses ph03 and owns mule account a02.",
        "Arresting Bhatia cuts the money bridge; residual path still reaches a mule via ph02 CALLED ph03.",
        "Residual phones sit on that path. No ASSOCIATED edges. No living public figures named.",
        "Demo: hairball → communities → accountant → PAID cycle → arrest sim → copilot.",
    ]

    print("GOLD")
    print(f"  accountant_id:        {gold['accountant_id']}")
    print(f"  kingpin_id:           {gold['kingpin_id']}")
    print(f"  mandi_location_id:    {gold['mandi_location_id']}")
    print(f"  mule_account_ids:     {gold['mule_account_ids']}")
    print(f"  residual_phone_ids:   {gold['residual_phone_ids']}")
    print(f"  accountant_degree:    {gold['accountant_degree']}")
    print(f"  residual_path:        {' → '.join(residual)}")
    print(f"  counts:               {universe['counts']}")
    print()
    print("CASE BIBLE")
    for i, line in enumerate(bible, 1):
        print(f"  {i:2d}. {line}")


if __name__ == "__main__":
    main()
