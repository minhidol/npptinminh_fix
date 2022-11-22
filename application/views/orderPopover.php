<?php
$listDetail = isset($order->order_detail) ? $order->order_detail : $order->detail;
if (!isset($totalValue)) {
    $totalValue = empty($order->chietKhau) ? 0 : $order->chietKhau * -1;
    foreach ($listDetail as $index => $detail) {
        $totalValue += $detail->quantity * $detail->price;
    }
}

if (!empty($order->note)) { ?>
    <div class="note">
        <?= $order->note ?>
    </div>
<?php } ?>
<div>
    <table class="display detail_order">
        <thead>
        <th>STT</th>
        <th>Tên hàng</th>
        <th>Số lượng</th>
        <th>Đơn giá</th>
        <?php if (!empty($moneyDetail)): ?>
            <th>Lệch:</th>
            <th><?= number_format($totalValue) ?></th>
        <?php endif; ?>
        </thead>
        <tbody>
        <?php
        $totalQuantity = 0;
        foreach ($listDetail as $index => $detail) {
            $totalQuantity += $detail->quantity;
            ?>
            <tr>
                <td><?= ($index + 1) ?></td>
                <td><?= $detail->product_name ?></td>
                <td class="text-right"><?= $detail->quantity ?></td>
                <td class="text-right"><?= number_format($detail->price) ?></td>
                <?php if (!empty($moneyDetail)): ?>
                    <td><?php echo $moneyDetail[$index] ? $moneyDetail[$index]->money_value : ''; ?></td>
                    <td><?php echo $moneyDetail[$index] ? $moneyDetail[$index]->quantity : ''; ?></td>
                <?php endif; ?>
            </tr>
        <?php } ?>
        <?php
        if (!empty($moneyDetail)):
            foreach ($moneyDetail as $i => $detail) {
                if ($i < count($listDetail)) continue;
                ?>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><?php echo $moneyDetail[$i] ? $moneyDetail[$i]->money_value : ''; ?></td>
                    <td><?php echo $moneyDetail[$i] ? $moneyDetail[$i]->quantity : ''; ?></td>
                </tr>
                <?php
            }
        endif;
        ?>
        <?php
        if (!empty($order->chietKhau) || !empty($order->khuyenMai) || !empty($order->orderGifts)): ?>

            <tr>
                <td colspan="<?= empty($moneyDetail) ? 4 : 6 ?>"><b>Khuyến mãi</b></td>
            </tr>
            <?php if (!empty($order->khuyenMai)): ?>
                <?php foreach ($order->khuyenMai as $khuyenMai) {
                    $listQuantity = [];
                    foreach( $khuyenMai->unit as $unit ) {
                        $listQuantity[] = number_format($unit->quantity) . " ({$unit->unit})";
                    }
                    ?>
                    <tr>
                        <td></td>
                        <td><?= $khuyenMai->productName ?></td>
                        <td><?= implode(" + ", $listQuantity) ?></td>
                        <td></td>
                        <?php if (!empty($moneyDetail)): ?>
                            <td></td>
                            <td></td>
                        <?php endif; ?>
                    </tr>
                <?php } ?>
            <?php endif; ?>

            <?php if (!empty($order->chietKhau)): ?>
                <tr>
                    <td></td>
                    <td>Chiết khấu</td>
                    <td></td>
                    <td class="text-right">-<?= number_format($order->chietKhau) ?></td>

                    <?php if (!empty($moneyDetail)): ?>
                        <td></td>
                        <td></td>
                    <?php endif; ?>
                </tr>
            <?php endif; ?>

            <?php if (!empty($order->orderGifts)): ?>
                <?php foreach ($order->orderGifts as $gift) { ?>
                    <tr>
                        <td colspan="4">(Tặng) <?= $gift ?></td>
                        <?php if (!empty($moneyDetail)): ?>
                            <td></td>
                            <td></td>
                        <?php endif; ?>
                    </tr>
                <?php } ?>
            <?php endif; ?>

        <?php endif; ?>
        </tbody>
        <tfoot>
        <tr>
            <th colspan="2" class="text-right">Tổng cộng</th>
            <th class="text-right"><?= number_format($totalQuantity) ?></th>
            <th class="text-right"><?= number_format($totalValue) ?></th>
            <?php if (!empty($moneyDetail)): ?>
                <th></th>
                <th></th>
            <?php endif; ?>
        </tr>
        </tfoot>
    </table>
</div>